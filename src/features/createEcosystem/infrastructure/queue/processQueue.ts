import {EcosystemQueue} from './createEcosystemQueue';
import {logger} from '../../../../infrastructure/logger';
import {saveErrors} from '../database/saveErrors';
import {verifyNode} from '../github/verifyNode';
import {transitionEcosystemState} from '../../../../infrastructure/stateMachine/transitionEcosystemState';
import {NodeName} from '../../../../domain/types';
import {saveGraph} from '../database/saveGraph';
import redis from '../../../../infrastructure/redis';
import {buildLockKey, buildProcessedJobsCounterKey} from '../redis/keys';
import {saveProcessingResultToRedis} from '../redis/saveProcessingResultToRedis';
import {getQueueProcessingStatus} from '../redis/getQueueProcessingStatus';
import {loadProcessingResultsFromRedis} from '../redis/loadProcessingResultsFromRedis';
import {deleteRedisData} from '../redis/deleteRedisData';

export const processQueue = async (queue: EcosystemQueue) => {
  queue.process(100, async job => {
    try {
      const {chainId, node} = job.data;

      const verificationResult = await verifyNode(
        node.projectName as NodeName,
        chainId,
      );

      return await saveProcessingResultToRedis({
        job: {id: job.id, data: job.data},
        verificationResult,
      });
    } catch (error) {
      logger.error(
        `Error processing job '${job.id}' for queue '${queue.name}'':`,
        error,
      );

      throw error; // This will cause the job to be re-tried (and eventually moved to the 'failed' state if all attempts fail).
    }
  });

  queue.on('succeeded', async job => {
    const {ecosystemId, chainId, totalJobs} = job.data;

    try {
      const {
        isProcessingCompleted,
        successfullyProcessedCount,
        unsuccessfullyProcessedCount,
        hasFailedJobs,
      } = await getQueueProcessingStatus(ecosystemId, chainId, totalJobs);

      // If the queue hasn't finished yet, log the progress and continue.
      if (!isProcessingCompleted) {
        logger.info(
          `Job '${job.id}' succeeded for queue '${queue.name}'. \n${successfullyProcessedCount + unsuccessfullyProcessedCount}/${totalJobs} jobs processed. Continuing...`,
        );

        return;
      }

      logger.info(
        `Queue '${queue.name}' completed processing all ${totalJobs} jobs.`,
      );

      if (hasFailedJobs) {
        logger.error(
          `Queue processing '${queue.name}' completed with errors. See logs for details.`,
        );

        await transitionEcosystemState(ecosystemId, 'PROCESSING_FAILED');

        await saveErrors(ecosystemId, 'Errors while processing ecosystem.');
      } else {
        const {
          hasUnsuccessfulJobs,
          successfullyVerifiedJobs,
          unsuccessfullyVerifiedJobs,
        } = await loadProcessingResultsFromRedis(
          ecosystemId,
          chainId,
          totalJobs,
        );

        if (hasUnsuccessfulJobs) {
          logger.warn(
            `Queue processing '${queue.name}' completed with some verification errors.`,
          );

          await saveErrors(
            ecosystemId,
            unsuccessfullyVerifiedJobs
              .map(
                j =>
                  `${j.verificationResult.failedProjectName}:${j.verificationResult.error}`,
              )
              .join(','),
          );

          await transitionEcosystemState(ecosystemId, 'PROCESSING_FAILED');
        } else {
          logger.info(
            `Queue processing '${queue.name}' completed. All projects verified successfully.`,
          );

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

          await saveGraph(ecosystemId, successfullyVerifiedJobs);
          await transitionEcosystemState(ecosystemId, 'PROCESSING_COMPLETED');
          await deleteRedisData(ecosystemId, chainId);
        }
      }
    } catch (error) {
      logger.error(
        `Error while processing succeeded job '${job.id}' for queue '${queue.name}'':`,
        error,
      );

      await transitionEcosystemState(ecosystemId, 'PROCESSING_FAILED');

      await saveErrors(
        ecosystemId,
        'An error occurred while processing ecosystem job.',
      );
    }
  });

  queue.on('failed', async (job, err) => {
    logger.error(`Job ${job.id} failed:`, {error: err});

    await redis.incr(
      buildProcessedJobsCounterKey(
        job.data.ecosystemId,
        job.data.chainId,
        'failed',
      ),
    );
  });

  queue.checkStalledJobs(8000, (err, numStalledJobs) => {
    if (err) {
      logger.error(
        `Error while checking stalled jobs for queue '${queue.name}'. Found ${numStalledJobs} stalled jobs. Error:`,
        err,
      );
    }
  });

  queue.on('job retrying', (jobId, err) => {
    logger.info(
      `Job with ID ${jobId} failed with error '${err.message}' but is being retried...`,
    );
  });
};
