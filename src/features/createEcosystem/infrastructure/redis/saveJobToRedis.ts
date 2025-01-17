import {ProjectVerificationJobData} from '../queue/createEcosystemQueue';
import {Job} from 'bee-queue';
import {logger} from '../../../../infrastructure/logger';
import redis from '../../../../infrastructure/redis';
import {queueId} from '../../application/queueId';

export const saveJobToRedis = async (job: Job<ProjectVerificationJobData>) => {
  const {ecosystemId, chainId} = job.data;

  const key = `results-${queueId(ecosystemId, chainId)}-job:${job.id}`;
  const value = JSON.stringify({
    id: job.id,
    data: job.data,
  });

  await redis.set(key, value);

  logger.info(`Entry saved: ${key} -> ${value}`);
};
