import {ChainId} from '../../../../domain/types';
import {Logger} from 'winston';
import {ProjectVerificationJobData} from '../queue/createEcosystemQueue';
import {Job} from 'bee-queue';
import {logger} from '../../../../infrastructure/logger';
import redis from '../../../../infrastructure/redis';
import {UUID} from 'crypto';
import {queueId} from '../../application/queueId';

export const deleteJobsFromRedis = async (
  ecosystemId: UUID,
  jobIds: string[],
  job: Job<ProjectVerificationJobData>,
) => {
  logger.info(`Deleting jobs for ecosystem '${ecosystemId}'...`);

  await Promise.all(
    Array.from(jobIds).map(jobId =>
      deleteCompletedJobFromRedis(job.data.chainId, jobId, ecosystemId),
    ),
  );

  logger.info(`Jobs deleted for ecosystem '${ecosystemId}'.`);
};

const deleteCompletedJobFromRedis = async (
  chainId: ChainId,
  jobId: string,
  ecosystemId: UUID,
) => {
  const qId = queueId(ecosystemId, chainId);
  const key = `results-${qId}-job:${jobId}`;

  await redis.del(key);
};
