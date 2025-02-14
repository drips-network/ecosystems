import {UUID} from 'crypto';
import {logger} from '../../../../infrastructure/logger';
import transitionEcosystemState from '../../../../infrastructure/stateMachine/transitionEcosystemState';
import saveError from '../database/saveError';
import saveGraph from '../database/saveGraph';
import deleteRedisData from '../redis/deleteRedisData';
import loadProcessingResultsFromRedis from '../redis/loadProcessingResultsFromRedis';
import {EcosystemQueue} from './createQueue';
import {ChainId} from '../../../../domain/types';

export default async function finalizeProcessing(
  ecosystemId: UUID,
  chainId: ChainId,
  totalJobs: number,
  queue: EcosystemQueue,
) {
  try {
    const {successful, failed} = await loadProcessingResultsFromRedis(
      ecosystemId,
      chainId,
      totalJobs,
    );

    if (failed.length) {
      const error = JSON.stringify(failed.map(j => j.verificationResult.error));

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
      await queue.destroy();
      await deleteRedisData(ecosystemId, chainId);
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
