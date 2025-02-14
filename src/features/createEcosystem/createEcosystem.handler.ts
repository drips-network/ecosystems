import {randomUUID, UUID} from 'crypto';
import {NewEcosystemRequestDto} from './createEcosystem.dto';
import {createQueue} from './infrastructure/queue/createQueue';
import {enqueueProjectVerificationJobs} from './infrastructure/queue/enqueueProjectVerificationJobs';
import {processQueue} from './infrastructure/queue/processQueue';
import {saveEcosystemIfNotExist} from './infrastructure/database/saveEcosystemIfNotExist';
import {validateGraph} from './application/validateGraph';

export const handleCreateEcosystem = async (
  request: NewEcosystemRequestDto,
): Promise<UUID> => {
  const ecosystemId = randomUUID();
  const {chainId, graph} = request;

  validateGraph(graph);

  const queue = createQueue(chainId, ecosystemId);

  await enqueueProjectVerificationJobs(chainId, ecosystemId, queue, graph);

  await saveEcosystemIfNotExist(ecosystemId, request);

  void processQueue(queue);

  return ecosystemId;
};
