import {UUID} from 'crypto';
import {ChainId} from '../../../../domain/types';

export const buildQueueId = (ecosystemId: UUID, chainId: ChainId) =>
  `ecosystem:${ecosystemId}-chain:${chainId}`;

export const buildProcessedResultsKey = (ecosystemId: UUID, chainId: ChainId) =>
  `${buildQueueId(ecosystemId, chainId)}-results`;

export const buildProcessedJobsCountKey = (
  ecosystemId: UUID,
  chainId: ChainId,
  type: 'success' | 'failed',
) => `${buildQueueId(ecosystemId, chainId)}-${type}-count`;

export const buildLockKey = (ecosystemId: UUID, chainId: ChainId) =>
  `lock-${buildQueueId(ecosystemId, chainId)}`;
