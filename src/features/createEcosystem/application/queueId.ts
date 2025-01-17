import {UUID} from 'crypto';
import {ChainId} from '../../../domain/types';

export const queueId = (ecosystemId: UUID, chainId: ChainId) =>
  `ecosystem:${ecosystemId}-chain:${chainId}`;
