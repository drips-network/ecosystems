import BeeQueue from 'bee-queue';
import {UUID} from 'crypto';
import {ChainId} from '../../../../domain/types';
import {EdgeDto, NodeDto} from '../../createEcosystem.dto';
import {buildQueueId} from '../redis/keys';
import {config} from '../../../../infrastructure/config/configLoader';

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

export const createQueue = (chainId: ChainId, ecosystemId: UUID) => {
  return new BeeQueue<ProjectVerificationJobData>(
    buildQueueId(ecosystemId, chainId),
    {
      isWorker: true,
      removeOnFailure: true,
      removeOnSuccess: true,
      activateDelayedJobs: true,
      redis: {url: config.redisConnectionString},
    },
  ) as EcosystemQueue;
};
