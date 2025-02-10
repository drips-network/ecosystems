import redis from '../../../../infrastructure/redis';
import {buildProcessedJobsCounterKey} from './keys';
import {ChainId} from '../../../../domain/types';
import {UUID} from 'crypto';

export const getQueueProcessingStatus = async (
  ecosystemId: UUID,
  chainId: ChainId,
  totalJobs: number,
) => {
  const successfullyProcessedCountStr = await redis.get(
    buildProcessedJobsCounterKey(ecosystemId, chainId, 'success'),
  );
  const successfullyProcessedCount = successfullyProcessedCountStr
    ? parseInt(successfullyProcessedCountStr, 10)
    : 0;

  const unsuccessfullyProcessedCountStr = await redis.get(
    buildProcessedJobsCounterKey(ecosystemId, chainId, 'failed'),
  );
  const unsuccessfullyProcessedCount = unsuccessfullyProcessedCountStr
    ? parseInt(unsuccessfullyProcessedCountStr, 10)
    : 0;

  return {
    isProcessingCompleted:
      successfullyProcessedCount + unsuccessfullyProcessedCount === totalJobs,
    hasFailedJobs: unsuccessfullyProcessedCount > 0,
    successfullyProcessedCount,
    unsuccessfullyProcessedCount,
  };
};
