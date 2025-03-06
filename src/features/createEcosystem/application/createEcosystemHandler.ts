import {randomUUID, UUID} from 'crypto';
import {NewEcosystemRequestDto} from '../api/createEcosystemDtos';
import {
  enqueueProjectVerificationJobs,
  ProjectVerificationJobData,
} from '../infrastructure/queue/enqueueProjectVerificationJobs';
import {processQueue} from '../infrastructure/queue/processQueue';
import {validateGraph} from './validateGraph';
import {saveEcosystemIfNotExist} from '../infrastructure/database/ecosystemRepository';
import BeeQueue from 'bee-queue';
import {config} from '../../../config/configLoader';
import createRedisOptions from '../infrastructure/redis/createRedisOptions';
import {logger} from '../../../common/infrastructure/logger';

export const handleCreateEcosystem = async (
  request: NewEcosystemRequestDto,
): Promise<UUID> => {
  const ecosystemId = randomUUID();
  const {chainId, graph} = request;

  validateGraph(graph);

  const {queueKey} = createRedisOptions(ecosystemId, chainId).keys;
  const queue = new BeeQueue<ProjectVerificationJobData>(queueKey, {
    isWorker: true,
    removeOnFailure: true,
    removeOnSuccess: true,
    activateDelayedJobs: true,
    redis: {url: config.redisConnectionString},
  });
  logger.info(
    `Created project verification queue '${queueKey}' for ecosystem '${ecosystemId}'.`,
  );

  await enqueueProjectVerificationJobs(queue, graph, chainId, ecosystemId);

  await saveEcosystemIfNotExist(ecosystemId, request);

  void processQueue(queue);

  return ecosystemId;
};
