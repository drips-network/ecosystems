import BeeQueue from 'bee-queue';
import {UUID} from 'crypto';
import {ChainId} from '../../../../domain/types';
import {EdgeDto, NodeDto} from '../../createEcosystem.dto';
import {buildQueueId} from '../redis/keys';
import {config} from '../../../../infrastructure/config/configLoader';

export type RateLimitInfo = {
  remaining: number;
  resetAt: Date;
  total: number;
};

export type ProjectVerificationJobData = {
  node: NodeDto;
  edges: EdgeDto[];
  chainId: ChainId;
  ecosystemId: UUID;
  totalJobs: number;
};

export type EcosystemQueue = BeeQueue<ProjectVerificationJobData> & {
  name: UUID;
};

export const createEcosystemQueue = (chainId: ChainId, ecosystemId: UUID) => {
  return new BeeQueue<ProjectVerificationJobData>(
    buildQueueId(ecosystemId, chainId),
    {
      isWorker: true,
      activateDelayedJobs: true,
      redis: {url: config.redisConnectionString},
    },
  ) as EcosystemQueue;
};
