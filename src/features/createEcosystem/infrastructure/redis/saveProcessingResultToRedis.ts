import {ProjectVerificationJobData} from '../queue/createEcosystemQueue';
import {logger} from '../../../../infrastructure/logger';
import redis from '../../../../infrastructure/redis';
import {buildProcessingResultKey, buildProcessedJobsCounterKey} from './keys';
import {NodeVerificationResult} from '../github/verifyNode';
import {Job} from 'bee-queue';

export type ProcessingResult = {
  job: Pick<Job<ProjectVerificationJobData>, 'id' | 'data'>;
  verificationResult: NodeVerificationResult;
};

export const saveProcessingResultToRedis = async (
  processingResult: ProcessingResult,
) => {
  const {
    job: {
      id,
      data: {ecosystemId, chainId},
    },
    verificationResult,
  } = processingResult;

  const key = buildProcessingResultKey(ecosystemId, chainId, id);
  const value = JSON.stringify(processingResult);

  await redis.set(key, value);

  await redis.incr(
    buildProcessedJobsCounterKey(
      ecosystemId,
      chainId,
      verificationResult.success ? 'success' : 'failed',
    ),
  );

  logger.debug(`Processing result saved to Redis: ${key} -> ${value}`);
};
