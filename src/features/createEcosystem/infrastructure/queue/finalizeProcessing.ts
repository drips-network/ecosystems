import {UUID} from 'crypto';
import {logger} from '../../../../common/infrastructure/logger';
import transitionEcosystemState from '../../../../common/infrastructure/stateMachine/transitionEcosystemState';
import {ChainId} from '../../../../common/domain/types';
import saveGraph from '../../application/saveGraph';
import {saveError} from '../database/ecosystemRepository';
import BeeQueue from 'bee-queue';
import {ProjectVerificationJobData} from './enqueueProjectVerificationJobs';
import deleteBqRedisData from '../redis/deleteBqRedisData';
import createRedisOptions from '../redis/createRedisOptions';
import {loadProjectVerificationResults} from '../redis/loadProjectVerificationResults';

export default async function finalizeProcessing(
  ecosystemId: UUID,
  chainId: ChainId,
  totalJobs: number,
  queue: BeeQueue<ProjectVerificationJobData>,
) {
  logger.info(`Finalizing processing for ecosystem '${ecosystemId}'...`);

  try {
    const {successful, failed} = await loadProjectVerificationResults(
      createRedisOptions(ecosystemId, chainId).keys,
      totalJobs,
    );

    if (failed.length) {
      const error = JSON.stringify(failed.map(j => j.error));

      logger.warn(
        `Queue '${queue.name}' processing completed. ${failed.length} project verification(s) failed. Errors: ${error}`,
      );

      await saveError(ecosystemId, error);
      await transitionEcosystemState(ecosystemId, 'PROCESSING_FAILED');
    } else {
      logger.info(
        `Queue '${queue.name}' processing completed. All projects verified successfully.`,
      );

      await saveGraph(ecosystemId, successful);
      await transitionEcosystemState(ecosystemId, 'PROCESSING_COMPLETED');
      await deleteBqRedisData(queue, ecosystemId, chainId);
    }
  } catch (error) {
    logger.error(`Error during finalization (queue '${queue.name}'):`, error);

    await transitionEcosystemState(ecosystemId, 'PROCESSING_FAILED');
    await saveError(
      ecosystemId,
      'An error occurred while trying to save Ecosystem.',
    );
  }
}
