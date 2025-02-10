import {UUID} from 'crypto';
import {ChainId} from '../../../../domain/types';

export const buildQueueId = (ecosystemId: UUID, chainId: ChainId) =>
  `ecosystem:${ecosystemId}-chain:${chainId}`;

export const buildProcessingResultKey = (
  ecosystemId: UUID,
  chainId: ChainId,
  jobId: string,
) => `results-${buildQueueId(ecosystemId, chainId)}-job:${jobId}`;

export const buildProcessedJobsCounterKey = (
  ecosystemId: UUID,
  chainId: ChainId,
  type: 'success' | 'failed',
) => `${buildQueueId(ecosystemId, chainId)}-count-${type}`;
