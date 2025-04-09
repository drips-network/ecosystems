import BeeQueue from 'bee-queue';
import {UUID} from 'crypto';
import {ChainId, OxString} from '../../../../common/domain/types';
import {logger} from '../../../../common/infrastructure/logger';
import createRedisOptions from '../redis/createRedisOptions';
import {loadSubListCreationResults} from '../redis/loadSubListCreationResults';
import {saveError} from '../../../createEcosystem/infrastructure/database/ecosystemRepository';
import transitionEcosystemState from '../../../../common/infrastructure/stateMachine/transitionEcosystemState';
import deleteBqRedisData from '../redis/deleteBqRedisData';
import createEcosystem from '../blockchain/createEcosystem';
import {setMainIdentityForEcosystem} from '../database/ecosystemRepository';
import {SubListsBatchJobData} from './enqueueJobs';
import {NormalizedEcosystemMainAccount} from '../../application/convertToEcosystemMainAccount';

type Params = {
  chainId: ChainId;
  totalJobs: number;
  ecosystemId: UUID;
  ownerAddress: OxString;
  queue: BeeQueue<SubListsBatchJobData>;
  ecosystemMainAccount: NormalizedEcosystemMainAccount;
};

export async function finalizeDeployment({
  queue,
  chainId,
  ecosystemMainAccount,
  totalJobs,
  ecosystemId,
  ownerAddress,
}: Params) {
  logger.info(`Finalizing deployment for ecosystem '${ecosystemId}'...`);

  try {
    const {successful, failed} = await loadSubListCreationResults(
      createRedisOptions(ecosystemId, chainId).keys,
      totalJobs,
    );

    if (failed.length) {
      const error = JSON.stringify(failed.map(j => j.error));

      logger.warn(
        `Queue '${queue.name}' processing completed. ${failed.length} transaction(s) failed. Errors: ${error}`,
      );

      await saveError(ecosystemId, error);
      await transitionEcosystemState(ecosystemId, 'DEPLOYMENT_FAILED');
    } else {
      logger.info(
        `Queue '${queue.name}' processing completed. All transactions confirmed successfully.`,
      );

      const txHash = await createEcosystem({
        chainId,
        ecosystemMainAccount,
        ecosystemId,
        ownerAddress,
        successfulSubListCreationResults: successful,
      });

      await setMainIdentityForEcosystem(
        txHash,
        ecosystemId,
        chainId,
        ecosystemMainAccount.accountId,
        ownerAddress,
      );
      await transitionEcosystemState(ecosystemId, 'DEPLOYMENT_COMPLETED');
      await deleteBqRedisData(queue, ecosystemId, chainId);
    }
  } catch (error) {
    logger.error(`Error during finalization (queue '${queue.name}'):`, error);

    await transitionEcosystemState(ecosystemId, 'DEPLOYMENT_FAILED');
    await saveError(
      ecosystemId,
      'An error occurred while trying to deploy Ecosystem.',
    );
  }
}

export async function deployEcosystem({
  chainId,
  ecosystemMainAccount,
  ecosystemId,
  ownerAddress,
}: {
  chainId: ChainId;
  ecosystemMainAccount: NormalizedEcosystemMainAccount;
  ecosystemId: UUID;
  ownerAddress: OxString;
}) {
  logger.info(`Finalizing deployment for ecosystem '${ecosystemId}'...`);

  try {
    const txHash = await createEcosystem({
      chainId,
      ecosystemMainAccount,
      ecosystemId,
      ownerAddress,
      successfulSubListCreationResults: [],
    });

    await setMainIdentityForEcosystem(
      txHash,
      ecosystemId,
      chainId,
      ecosystemMainAccount.accountId,
      ownerAddress,
    );
    await transitionEcosystemState(ecosystemId, 'DEPLOYMENT_COMPLETED');
  } catch (error) {
    logger.error('Error during finalization:', error);

    await transitionEcosystemState(ecosystemId, 'DEPLOYMENT_FAILED');
    await saveError(
      ecosystemId,
      'An error occurred while trying to deploy Ecosystem.',
    );
  }
}
