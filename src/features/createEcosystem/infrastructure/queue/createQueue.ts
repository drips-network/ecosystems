import BeeQueue from 'bee-queue';
import {UUID} from 'crypto';
import {EdgeDto, NodeDto} from '../../api/createEcosystemDtos';
import {buildQueueId} from '../redis/keys';
import {ChainId} from '../../../../common/domain/types';
import {config} from '../../../../config/configLoader';

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
