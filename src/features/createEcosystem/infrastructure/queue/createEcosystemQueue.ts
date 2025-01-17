import BeeQueue from 'bee-queue';
import {UUID} from 'crypto';
import {ChainId} from '../../../../domain/types';
import {VerificationResult} from '../github/verifyNode';
import {EdgeDto, NodeDto} from '../../createEcosystem.dto';
import {queueId} from '../../application/queueId';
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
  verificationResult?: VerificationResult;
};

export type EcosystemQueue = BeeQueue<ProjectVerificationJobData> & {
  name: UUID;
};

export const createEcosystemQueue = (chainId: ChainId, ecosystemId: UUID) => {
  return new BeeQueue<ProjectVerificationJobData>(
    queueId(ecosystemId, chainId),
    {
      isWorker: true,
      activateDelayedJobs: true,
      redis: {url: config.redisConnectionString},
    },
  ) as EcosystemQueue;
};
