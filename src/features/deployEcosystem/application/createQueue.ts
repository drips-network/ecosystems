import BeeQueue from 'bee-queue';
import {UUID} from 'crypto';
import {logger} from '../../../common/infrastructure/logger';
import createRedisOptions from '../infrastructure/redis/createRedisOptions';
import {config} from '../../../config/configLoader';
import {SubListsBatchJobData} from '../infrastructure/queue/enqueueJobs';

export default function createQueue(ecosystemId: UUID, chainId: string) {
  const {queueKey} = createRedisOptions(ecosystemId, chainId).keys;

  const queue = new BeeQueue<SubListsBatchJobData>(queueKey, {
    isWorker: true,
    removeOnFailure: true,
    removeOnSuccess: true,
    activateDelayedJobs: true,
    redis: {url: config.redisConnectionString},
  });

  logger.info(
    `Created transactions queue '${queueKey}' for ecosystem '${ecosystemId}'.`,
  );

  return queue;
}
