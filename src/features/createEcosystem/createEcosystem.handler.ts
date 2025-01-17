import {randomUUID, UUID} from 'crypto';
import {NewEcosystemRequestDto} from './createEcosystem.dto';
import {createEcosystemQueue} from './infrastructure/queue/createEcosystemQueue';
import {enqueueProjectVerificationJobs} from './infrastructure/queue/enqueueProjectVerificationJobs';
import {startQueueProcessing} from './infrastructure/queue/startQueueProcessing';
import {saveEcosystemIfNotExist} from './infrastructure/database/saveEcosystemIfNotExist';
import {validateEcosystemGraph} from './application/validateEcosystemGraph';

export const handleCreateEcosystem = async (
  request: NewEcosystemRequestDto,
): Promise<UUID> => {
  const ecosystemId = randomUUID();
  const {chainId, graph} = request;

  validateEcosystemGraph(graph);

  const queue = createEcosystemQueue(chainId, ecosystemId);

  const jobsCount = await enqueueProjectVerificationJobs(
    chainId,
    ecosystemId,
    queue,
    graph,
  );

  await saveEcosystemIfNotExist(ecosystemId, request);

  void startQueueProcessing(queue, jobsCount);

  return ecosystemId;
};
