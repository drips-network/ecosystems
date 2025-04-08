import {UUID} from 'crypto';
import {ChainId, OxString} from '../../../../common/domain/types';
import {executeCallerWriteTx} from '../../../../common/infrastructure/contracts/caller/caller';
import {logger} from '../../../../common/infrastructure/logger';
import waitUntilTxIsConfirmed from '../../application/waitUntilTxIsConfirmed';
import {SuccessfulSubListCreationResult} from '../redis/createRedisOptions';
import {populateEcosystemMainAccountCreationTxs} from './populateTransactions';
import {pinEcosystemMetadata} from '../ipfs/metadata';
import unreachable from '../../../../common/application/unreachable';
import {NormalizedEcosystemMainIdentity} from '../../application/convertToEcosystemMainAccount';
import {ProjectReceiver, SubListReceiver} from '../../application/types';

type Params = {
  chainId: ChainId;
  ecosystemId: UUID;
  ownerAddress: OxString;
  ecosystemMainAccount: NormalizedEcosystemMainIdentity;
  successfulSubListCreationResults: SuccessfulSubListCreationResult[];
};

export default async function createEcosystem({
  chainId,
  ecosystemMainAccount,
  ecosystemId,
  ownerAddress,
  successfulSubListCreationResults,
}: Params) {
  // Validate if all results have the same parent Ecosystem Main Account.
  if (
    !successfulSubListCreationResults.every(
      result =>
        result.ecosystemMainAccountId === ecosystemMainAccount.accountId,
    )
  ) {
    unreachable(
      'All results must have the same parent Ecosystem Main Account.',
    );
  }

  const receivers = [...ecosystemMainAccount.projectReceivers] as (
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

  const ipfsHash = await pinEcosystemMetadata(
    ecosystemId,
    ecosystemMainAccount.accountId,
    receivers,
  );

  const txs = await populateEcosystemMainAccountCreationTxs(
    ecosystemMainAccount.accountId,
    ecosystemMainAccount.salt,
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
    `Executing caller transaction '${hash}' to create the Ecosystem Main Account for ecosystem '${ecosystemId}'...`,
  );
  await waitUntilTxIsConfirmed(hash as OxString, chainId);

  logger.info(
    `Ecosystem Main Account creation transaction for ecosystem '${ecosystemId}' confirmed.`,
  );

  return hash as OxString;
}
