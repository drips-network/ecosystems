import BeeQueue from 'bee-queue';
import {assertIsProjectName} from '../../../../common/application/assertions';
import {logger} from '../../../../common/infrastructure/logger';
import verifyNode from '../github/verifyNode';
import finalizeProcessing from './finalizeProcessing';
import {ProjectVerificationJobData} from './enqueueProjectVerificationJobs';
import {saveProcessedJob} from '../../../../common/infrastructure/redis/saveProcessedJob';
import createRedisOptions, {
  FailedProjectVerificationResult,
  SuccessfulProjectVerificationResult,
} from '../redis/createRedisOptions';

export const processQueue = async (
  queue: BeeQueue<ProjectVerificationJobData>,
) => {
  queue.process(10, async job => {
    const {
      chainId,
      ecosystemId,
      totalJobs,
      node: {projectName},
    } = job.data;
    assertIsProjectName(projectName);

    try {
      const verificationResult = await verifyNode({projectName, chainId});

      if (!verificationResult.success) {
        job.retries(0); // No need to retry if verification failed.
      }

      const {isProcessingCompleted, progress} = await saveProcessedJob(
        job,
        verificationResult.success
          ? ({
              verificationResult,
              node: job.data.node,
              edges: job.data.edges,
              success: true as const,
              originalProjectName: projectName,
            } as SuccessfulProjectVerificationResult)
          : ({
              success: false as const,
              error: verificationResult.error,
              verificationResult,
            } as FailedProjectVerificationResult),
        createRedisOptions(ecosystemId, chainId),
      );

      logger.info(
        `⏳ Progress: ${progress}/${totalJobs} (queue: '${queue.name}', processed job '${job.id}', project: '${projectName}').`,
      );

      if (isProcessingCompleted) {
        await finalizeProcessing(ecosystemId, chainId, totalJobs, queue);
      }

      return Promise.resolve();
    } catch (error) {
      logger.error(
        `Error while processing job '${job.id}' (project: '${projectName}', queue: '${queue.name}'):`,
        error,
      );

      await saveProcessedJob(
        job,
        {
          success: false as const,
          error:
            // This will be propagated to the app.
            error instanceof Error
              ? error.message
              : `An unknown error occurred while processing ${projectName}`,
        },
        createRedisOptions(ecosystemId, chainId),
      );

      return Promise.reject(error);
    }
  });

  queue.on('job failed', async (jobId, err) => {
    logger.error(
      `❌ Job '${jobId}' (queue: '${queue.name}') failed after all retries:`,
      err,
    );
  });

  queue.on('job retrying', (jobId, err) => {
    logger.info(
      `♻️ Job '${jobId}' failed with error '${err.message}' but is being retried...`,
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
