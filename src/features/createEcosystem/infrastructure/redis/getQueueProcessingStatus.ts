import redis from '../../../../common/infrastructure/redis';
import {UUID} from 'crypto';
import {buildProcessedJobsCountKey} from './keys';
import {ChainId} from '../../../../common/domain/types';

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
