import {toBigInt} from 'ethers';
import {
  AccountId,
  ChainId,
  IpfsHash,
  OxString,
  SplitsReceiver,
} from '../../../../common/domain/types';
import {populateNftDriverWriteTx} from '../../../../common/infrastructure/contracts/nftDriver/nftDriver';
import {
  CallerCall,
  convertToCallerCall,
} from '../../../../common/infrastructure/contracts/caller/caller';
import {
  keyValueToMetadata,
  pinSubListMetadata,
  USER_METADATA_KEY,
} from '../ipfs/metadata';
import {Receiver} from '../../application/types';
import {executeDripsReadMethod} from '../../../../common/infrastructure/contracts/drips/drips';
import {populateImmutableSplitsDriverWriteTx} from '../../../../common/infrastructure/contracts/immutableSplits/immutableSplits';
import {SubList} from '../../application/batchSubLists';
import getWallet from '../../../../common/infrastructure/contracts/getWallet';
import {logger} from '../../../../common/infrastructure/logger';

export async function populateEcosystemMainAccountCreationTxs(
  listId: string,
  salt: bigint,
  ipfsHash: IpfsHash,
  ownerAddress: OxString,
  chainId: ChainId,
  receivers: Receiver[],
) {
  const deployerAddress = getWallet(chainId).address as OxString;

  const ecosystemMainAccountCreationTx = await populateNftDriverWriteTx({
    functionName: 'safeMintWithSalt',
    args: [
      toBigInt(salt),
      deployerAddress,
      [
        {
          key: USER_METADATA_KEY,
          value: ipfsHash,
        },
      ].map(keyValueToMetadata),
    ],
    chainId,
  });

  const formattedReceivers = formatSplitReceivers(receivers);
  logger.info('Receivers context for ecosystem main account creation', {
    listId,
    receiversCount: formattedReceivers.length,
    receivers: formattedReceivers.map(r => ({
      accountId: r.accountId.toString(),
      weight: r.weight,
    })),
  });

  const setEcosystemMainAccountSplitsTx = await populateNftDriverWriteTx({
    functionName: 'setSplits',
    args: [toBigInt(listId), formattedReceivers],
    chainId,
  });

  const transferOwnershipTx = await populateNftDriverWriteTx({
    functionName: 'safeTransferFrom',
    args: [deployerAddress, ownerAddress, toBigInt(listId)],
    chainId,
  });

  return [
    convertToCallerCall(ecosystemMainAccountCreationTx),
    convertToCallerCall(setEcosystemMainAccountSplitsTx),
    convertToCallerCall(transferOwnershipTx),
  ];
}

export async function populateSubListCreationTxsByReceiversHash(
  subList: SubList,
  chainId: ChainId,
  ecosystemMainAccountId: AccountId,
) {
  const map: Map<
    OxString,
    {
      tx: CallerCall;
      weight: number;
    }
  > = new Map();

  const ipfsHash = await pinSubListMetadata(
    ecosystemMainAccountId,
    subList.receivers,
  );

  const formattedReceivers = formatSplitReceivers(subList.receivers);
  logger.info('Receivers context for sub list creation', {
    ecosystemMainAccountId,
    subListWeight: subList.weight,
    receiversCount: formattedReceivers.length,
    receivers: formattedReceivers.map(r => ({
      accountId: r.accountId.toString(),
      weight: r.weight,
    })),
  });

  const tx = await populateImmutableSplitsDriverWriteTx({
    functionName: 'createSplits',
    args: [
      formattedReceivers,
      [
        {
          key: USER_METADATA_KEY,
          value: ipfsHash,
        },
      ].map(keyValueToMetadata),
    ],
    chainId,
  });

  const receiversHash = await executeDripsReadMethod({
    functionName: 'hashSplits',
    args: [formattedReceivers],
    chainId,
  });

  map.set(receiversHash, {
    tx: convertToCallerCall(tx),
    weight: subList.weight,
  });

  return map;
}

export function formatSplitReceivers(receivers: Receiver[]): SplitsReceiver[] {
  // Splits receivers must be sorted by user ID, deduplicated, and without weights <= 0.

  const uniqueReceivers = receivers.reduce((unique: Receiver[], o) => {
    if (
      !unique.some(
        (obj: Receiver) =>
          obj.accountId === o.accountId && obj.weight === o.weight,
      )
    ) {
      unique.push(o);
    }
    return unique;
  }, []);

  const sortedReceivers = uniqueReceivers.sort((a, b) =>
    // Sort by user ID.

    toBigInt(a.accountId) > toBigInt(b.accountId)
      ? 1
      : toBigInt(a.accountId) < toBigInt(b.accountId)
        ? -1
        : 0,
  );

  return sortedReceivers.map(r => ({
    accountId: toBigInt(r.accountId),
    weight: r.weight,
  }));
}
