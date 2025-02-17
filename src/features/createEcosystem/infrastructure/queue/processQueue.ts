import assertIsProjectName from '../../../../common/application/assertIsProjectName';
import {logger} from '../../../../common/infrastructure/logger';
import verifyNode from '../github/verifyNode';
import saveProcessingResultToRedis from '../redis/saveProcessingResultToRedis';
import {EcosystemQueue} from './createQueue';
import finalizeProcessing from './finalizeProcessing';

export const processQueue = async (queue: EcosystemQueue) => {
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

      const {isProcessingCompleted, progress} =
        await saveProcessingResultToRedis(job, verificationResult);

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
