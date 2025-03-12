import {UUID} from 'crypto';
import {ChainId, OxString} from '../../../../common/domain/types';
import {executeCallerWriteTx} from '../../../../common/infrastructure/contracts/caller/caller';
import {logger} from '../../../../common/infrastructure/logger';
import waitUntilTxIsConfirmed from '../../application/waitUntilTxIsConfirmed';
import {SuccessfulSubListCreationResult} from '../redis/createRedisOptions';
import {populateDripListCreationTxs} from './populateTransactions';
import {pinDripListMetadata} from '../ipfs/metadata';
import unreachable from '../../../../common/application/unreachable';
import {NormalizedDripList} from '../../application/convertToDripList';
import {ProjectReceiver, SubListReceiver} from '../../application/types';

type Params = {
  chainId: ChainId;
  ecosystemId: UUID;
  ownerAddress: OxString;
  dripList: NormalizedDripList;
  successfulSubListCreationResults: SuccessfulSubListCreationResult[];
};

export default async function createMainIdentity({
  chainId,
  dripList,
  ecosystemId,
  ownerAddress,
  successfulSubListCreationResults,
}: Params) {
  // Validate if all results have the same parent Drip List.
  if (
    !successfulSubListCreationResults.every(
      result => result.parentDripListId === dripList.accountId,
    )
  ) {
    unreachable('All results must have the same parent Drip List.');
  }

  const receivers = [...dripList.projectReceivers] as (
    | ProjectReceiver
    | SubListReceiver
  )[];
  if (successfulSubListCreationResults.length) {
    receivers.push(
      ...successfulSubListCreationResults.flatMap(
        result => result.batchSubListReceivers,
      ),
    );
  }

  const ipfsHash = await pinDripListMetadata(
    ecosystemId,
    dripList.accountId,
    receivers,
  );

  const txs = await populateDripListCreationTxs(
    dripList.accountId,
    dripList.salt,
    ipfsHash,
    ownerAddress,
    chainId,
    receivers,
  );

  const {hash} = await executeCallerWriteTx({
    functionName: 'callBatched',
    args: [[...txs]],
    chainId,
  });
  logger.info(
    `Executing caller transaction '${hash}' to create the main Drip List for ecosystem '${ecosystemId}'...`,
  );
  await waitUntilTxIsConfirmed(hash as OxString, chainId);

  logger.info(
    `Main Drip List creation transaction for ecosystem '${ecosystemId}' confirmed.`,
  );

  return hash as OxString;
}
