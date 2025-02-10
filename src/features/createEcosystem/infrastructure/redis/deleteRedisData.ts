import {logger} from '../../../../infrastructure/logger';
import redis from '../../../../infrastructure/redis';
import {UUID} from 'crypto';
import {buildQueueId} from './keys';
import {ChainId} from '../../../../domain/types';

export const deleteRedisData = async (ecosystemId: UUID, chainId: ChainId) => {
  logger.info(`Deleting queues from Redis for ecosystem '${ecosystemId}'...`);

  const qId = buildQueueId(ecosystemId, chainId);
  const keys = await redis.keys(`*${qId}*`);

  if (keys.length === 0) {
    logger.info(`No queues found for ecosystem '${ecosystemId}'.`);
    return;
  }

  await redis.del(...keys);

  logger.info(`Deleted Redis data for ecosystem '${ecosystemId}'.`);
};
