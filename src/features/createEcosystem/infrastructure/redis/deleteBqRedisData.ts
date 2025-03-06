import {UUID} from 'crypto';
import redis from '../../../../common/infrastructure/redis';
import {ChainId} from '../../../../common/domain/types';
import createRedisOptions from './createRedisOptions';
import BeeQueue from 'bee-queue';
import {ProjectVerificationJobData} from '../queue/enqueueProjectVerificationJobs';

export default async function deleteBqRedisData(
  queue: BeeQueue<ProjectVerificationJobData>,
  ecosystemId: UUID,
  chainId: ChainId,
) {
  await queue.destroy();

  const {resultsKey, successCountKey, lockKey} = createRedisOptions(
    ecosystemId,
    chainId,
  ).keys;

  await redis.del(...[resultsKey, successCountKey, lockKey]);
}
