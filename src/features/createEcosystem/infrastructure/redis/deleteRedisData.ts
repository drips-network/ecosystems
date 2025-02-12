import {logger} from '../../../../infrastructure/logger';
import redis from '../../../../infrastructure/redis';
import {UUID} from 'crypto';
import {buildQueueId} from './keys';
import {ChainId} from '../../../../domain/types';

export default async function deleteRedisData(
  ecosystemId: UUID,
  chainId: ChainId,
) {
  const qId = buildQueueId(ecosystemId, chainId);
  const keys = await redis.keys(`*${qId}*`);

  await redis.del(...keys);

  logger.info(`Deleted custom Redis data for ecosystem '${ecosystemId}'.`);
}
