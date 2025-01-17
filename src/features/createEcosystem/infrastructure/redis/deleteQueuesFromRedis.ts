import {logger} from '../../../../infrastructure/logger';
import redis from '../../../../infrastructure/redis';
import {UUID} from 'crypto';
import {queueId} from '../../application/queueId';
import {ChainId} from '../../../../domain/types';

export const deleteQueuesFromRedis = async (
  ecosystemId: UUID,
  chainId: ChainId,
) => {
  logger.info(`Deleting queues from Redis for ecosystem '${ecosystemId}'...`);

  const qId = queueId(ecosystemId, chainId);
  const keys = await redis.keys(`bq:${qId}*`);

  if (keys.length === 0) {
    logger.info(`No queues found for ecosystem '${ecosystemId}'.`);
    return;
  }

  await redis.del(...keys);

  logger.info(`Queues deleted: ${keys}`);
};
