import {logger} from '../../../../common/infrastructure/logger';
import redis from '../../../../common/infrastructure/redis';
import {UUID} from 'crypto';
import {buildQueueId} from './keys';
import {ChainId} from '../../../../common/domain/types';

export default async function deleteRedisData(
  ecosystemId: UUID,
  chainId: ChainId,
) {
  const qId = buildQueueId(ecosystemId, chainId);
  const keys = await redis.keys(`*${qId}*`);

  await redis.del(...keys);

  logger.info(`Deleted custom Redis data for ecosystem '${ecosystemId}'.`);
}
