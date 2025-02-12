import redis from '../../../../infrastructure/redis';
import {ChainId} from '../../../../domain/types';
import {UUID} from 'crypto';
import {buildProcessedJobsCountKey} from './keys';

export default async function getQueueProcessingStatus(
  ecosystemId: UUID,
  chainId: ChainId,
  totalJobs: number,
) {
  const successfullyProcessedCountStr = await redis.get(
    buildProcessedJobsCountKey(ecosystemId, chainId, 'success'),
  );
  const successfullyProcessedCount = successfullyProcessedCountStr
    ? parseInt(successfullyProcessedCountStr, 10)
    : 0;

  const unsuccessfullyProcessedCountStr = await redis.get(
    buildProcessedJobsCountKey(ecosystemId, chainId, 'failed'),
  );
  const unsuccessfullyProcessedCount = unsuccessfullyProcessedCountStr
    ? parseInt(unsuccessfullyProcessedCountStr, 10)
    : 0;

  return {
    isProcessingCompleted:
      successfullyProcessedCount + unsuccessfullyProcessedCount === totalJobs,
    successfullyProcessedCount,
    unsuccessfullyProcessedCount,
  };
}
