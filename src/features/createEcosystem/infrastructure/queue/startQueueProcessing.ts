import {EcosystemQueue} from './createEcosystemQueue';
import {logger} from '../../../../infrastructure/logger';
import {saveErrors} from '../database/saveErrors';
import {saveNodesAndEdges} from '../database/saveNodesAndEdges';
import unreachable from '../../../../application/unreachable';
import {deleteJobsFromRedis} from '../redis/deleteJobsFromRedis';
import {verifyNode} from '../github/verifyNode';
import {saveJobToRedis} from '../redis/saveJobToRedis';
import {loadJobsFromRedis} from '../redis/loadJobsFromRedis';
import {deleteQueuesFromRedis} from '../redis/deleteQueuesFromRedis';
import {transitionEcosystemState} from '../../../../infrastructure/stateMachine/transitionEcosystemState';

export const startQueueProcessing = async (
  queue: EcosystemQueue,
  jobsCount: number,
) => {
  queue.process(async job => {
    try {
      const verificationResult = await verifyNode(job.data);

      job.data.verificationResult = verificationResult;

      return;
    } catch (error) {
      logger.error(
        `Error while processing job '${job.id}' for queue '${queue.name}'':`,
        error,
        job,
      );

      throw error; // This will cause the job to be re-tried and eventually moved to the 'failed' state.
    }
  });

  queue.on('succeeded', async job => {
    const {ecosystemId, chainId} = job.data;

    try {
      await saveJobToRedis(job);

      const {succeeded, failed} = await queue.checkHealth();

      const hasQueueFinished = succeeded + failed === jobsCount;

      // If the queue hasn't finished yet, log the progress and continue.
      if (!hasQueueFinished) {
        logger.info(
          `Job succeeded. Processed ${succeeded + failed}/${jobsCount} jobs. Continuing...`,
        );

        return;
      }

      logger.info(
        `Queue processing '${queue.name}' completed. Processed all ${succeeded + failed}/${jobsCount} jobs.`,
      );

      // If the queue has finished, check if all jobs have completed _processing_ successfully.
      // `succeeded` doesn't mean that the _verification_ was successful, but that the job was _processed_ without unexpected errors.
      const allJobsProcessedSuccessfully = succeeded === jobsCount;
      if (allJobsProcessedSuccessfully) {
        const {successfullyVerifiedJobs, unsuccessfullyVerifiedJobs} =
          await loadJobsFromRedis(ecosystemId, chainId, jobsCount);

        if (
          successfullyVerifiedJobs.length +
            unsuccessfullyVerifiedJobs.length !==
          jobsCount
        ) {
          unreachable(
            `Unexpected number of processed jobs in queue '${queue.name}'.'`,
          );
        }

        // All jobs have passed the verification successfully.
        if (!unsuccessfullyVerifiedJobs.length) {
          logger.info(
            `Queue processing '${queue.name}' completed. All jobs succeeded.`,
          );

          const {savedJobIds} = await saveNodesAndEdges(
            ecosystemId,
            successfullyVerifiedJobs,
          );

          if (savedJobIds.length !== jobsCount) {
            unreachable(
              `Unexpected number of saved jobs in queue '${queue.name}'.'`,
            );
          }

          await transitionEcosystemState(ecosystemId, 'UPLOAD_SUCCESS');

          await deleteJobsFromRedis(ecosystemId, savedJobIds, job);
          await deleteQueuesFromRedis(ecosystemId, chainId);
        } else {
          logger.warn(
            `Queue processing '${queue.name}' completed. Some verifications failed!`,
          );

          await saveErrors(
            ecosystemId,
            unsuccessfullyVerifiedJobs
              .map(
                j =>
                  `${j.data.verificationResult.failedProjectName}:${j.data.verificationResult.error}`,
              )
              .join(','),
          );

          await transitionEcosystemState(ecosystemId, 'UPLOAD_FAILURE');
        }
      } else {
        // The queue has finished processing all jobs, but some of them unexpectedly failed.

        const failed = await queue.getJobs('failed', {
          size: jobsCount,
        });

        logger.error(
          `Queue processing '${queue.name}' completed but the following jobs failed: ${failed
            .map(j => j.id)
            .join(', ')}`,
        );

        await transitionEcosystemState(ecosystemId, 'UPLOAD_FAILURE');

        await saveErrors(
          ecosystemId,
          'Processing ecosystem completed with errors.',
        );
      }
    } catch (error) {
      logger.error(
        `Error while processing succeeded job '${job.id}' for queue '${queue.name}'':`,
        error,
      );

      await transitionEcosystemState(ecosystemId, 'UPLOAD_FAILURE');

      await saveErrors(
        ecosystemId,
        'An error occurred while processing ecosystem job.',
      );
    }
  });

  queue.on('failed', (job, err) => {
    logger.error(`Job ${job.id} failed:`, {error: err});
  });

  queue.checkStalledJobs(8000, (err, numStalledJobs) => {
    if (err) {
      logger.error(
        `Error while checking stalled jobs for queue '${queue.name}'. Found ${numStalledJobs} stalled jobs. Error:`,
        err,
      );
    }
  });
};
