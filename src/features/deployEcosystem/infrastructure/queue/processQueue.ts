import BeeQueue from 'bee-queue';
import {createNonSponsoredTransactionStrategy} from './createNonSponsoredTransactionStrategy';
import {logger} from '../../../../common/infrastructure/logger';
import {config} from '../../../../config/configLoader';
import {finalizeDeployment} from './finalizeDeployment';
import {saveProcessedJob} from '../../../../common/infrastructure/redis/saveProcessedJob';
import createRedisOptions from '../redis/createRedisOptions';
import {SubListsBatchJobData} from './enqueueJobs';
import {NormalizedEcosystemMainIdentity} from '../../application/convertToEcosystemMainAccount';

export const processQueue = async (
  queue: BeeQueue<SubListsBatchJobData>,
  ecosystemMainAccount: NormalizedEcosystemMainIdentity,
) => {
  queue.process(async job => {
    const {chainId, ecosystemId, totalTxs, ownerAddress} = job.data;

    if (config.shouldSponsorTxs) {
      return Promise.reject(
        new Error('Transaction sponsorship is not implemented yet.'),
      );
    }

    try {
      const subListReceivers =
        await createNonSponsoredTransactionStrategy().executeTx({
          job: job.data,
          ecosystemMainAccountId: ecosystemMainAccount.accountId,
        });

      const {isProcessingCompleted, progress} = await saveProcessedJob(
        job,
        {
          success: true as const,
          ecosystemMainAccountId: ecosystemMainAccount.accountId,
          batchSubListReceivers: subListReceivers,
        },
        createRedisOptions(ecosystemId, chainId),
      );

      logger.info(
        `⏳ Progress: ${progress}/${totalTxs} (queue: '${queue.name}', processed job '${job.id}'.`,
      );

      if (isProcessingCompleted) {
        await finalizeDeployment({
          queue,
          chainId,
          ecosystemMainAccount,
          ecosystemId,
          ownerAddress,
          totalJobs: totalTxs,
        });
      }

      return Promise.resolve();
    } catch (error) {
      logger.error(
        `Error while processing job '${job.id}' (queue: '${queue.name}'):`,
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
              : 'An unknown error occurred while trying to submit a transaction.',
        },
        createRedisOptions(ecosystemId, chainId),
      );

      return Promise.reject(error);
    }
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
