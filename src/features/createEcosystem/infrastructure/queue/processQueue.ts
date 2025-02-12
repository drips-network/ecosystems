import {EcosystemQueue} from './createEcosystemQueue';
import {logger} from '../../../../infrastructure/logger';
import transitionEcosystemState from '../../../../infrastructure/stateMachine/transitionEcosystemState';
import saveGraph from '../database/saveGraph';
import redis from '../../../../infrastructure/redis';
import {buildLockKey} from '../redis/keys';
import saveProcessingResultToRedis from '../redis/saveProcessingResultToRedis';
import getQueueProcessingStatus from '../redis/getQueueProcessingStatus';
import loadProcessingResultsFromRedis from '../redis/loadProcessingResultsFromRedis';
import deleteRedisData from '../redis/deleteRedisData';
import saveError from '../database/saveError';
import assertIsProjectName from '../../../../application/assertIsProjectName';
import verifyNode from '../github/verifyNode';

export const processQueue = async (queue: EcosystemQueue) => {
  queue.process(5, async job => {
    const {
      chainId,
      node: {projectName},
    } = job.data;

    assertIsProjectName(projectName);

    try {
      const verificationResult = await verifyNode({projectName, chainId});

      await saveProcessingResultToRedis(job, verificationResult);

      return Promise.resolve();
    } catch (error) {
      logger.error(
        `Error while processing job '${job.id}' for '${projectName}' (queue: '${queue.name}'):`,
        error,
      );

      await saveProcessingResultToRedis(job, {
        success: false,
        error:
          // This will be propagated to the app.
          error instanceof Error
            ? error.message
            : `An unknown error occurred while processing ${projectName}`,
        failedProjectName: projectName,
      });

      return Promise.reject(error);
    }
  });

  queue.on('succeeded', async job => {
    const {ecosystemId, chainId, totalJobs} = job.data;

    try {
      const {
        isProcessingCompleted,
        successfullyProcessedCount,
        unsuccessfullyProcessedCount,
      } = await getQueueProcessingStatus(ecosystemId, chainId, totalJobs);

      // Processing is not completed yet.
      if (!isProcessingCompleted) {
        logger.info(
          `Job '${job.id}' succeeded.
          \nQueue '${queue.name}' progress: ${successfullyProcessedCount + unsuccessfullyProcessedCount}/${totalJobs} jobs.`,
        );

        return;
      }

      // Processing is completed.

      // Acquire a lock to prevent other processes from running the finalization logic.
      const acquired = await redis.set(
        buildLockKey(ecosystemId, chainId),
        'locked',
        'EX',
        60, // 1 minute.
        'NX',
      );
      if (!acquired) {
        // Another process already acquired the lock.
        return;
      }

      const {successful, failed} = await loadProcessingResultsFromRedis(
        ecosystemId,
        chainId,
        totalJobs,
      );

      if (failed.length) {
        const error = JSON.stringify(
          failed.map(j => j.verificationResult.error),
        );

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
      logger.error(
        `Error while processing succeeded job '${job.id}' (queue: '${queue.name}'):`,
        error,
      );

      await transitionEcosystemState(ecosystemId, 'PROCESSING_FAILED');
      await saveError(
        ecosystemId,
        'An error occurred while trying to save Ecosystem.',
      );
    }
  });

  queue.on('job failed', async (jobId, err) => {
    logger.error(
      `❌ Job '${jobId}' (queue: '${queue.name}') failed after all retries:`,
      err,
    );
  });

  queue.on('job retrying', (job, err) => {
    logger.info(
      `♻️ Job with ID ${job} failed with error '${err.message}' but is being retried...`,
    );
  });

  queue.on('error', async err => {
    logger.error(`🚨 Queue '${queue.name}' error:`, err);
  });

  queue.checkStalledJobs(8000, (err, numStalledJobs) => {
    if (err) {
      logger.error(
        `❌⏱️ Error while checking stalled jobs (queue: '${queue.name}', stalled jobs: ${numStalledJobs}):`,
        err,
      );
    }
  });
};
