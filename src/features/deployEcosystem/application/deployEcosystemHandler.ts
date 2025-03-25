import {DeployEcosystemRequestDto} from '../api/deployEcosystemDto';
import {
  assertIsOxString,
  assertIsUUID,
} from '../../../common/application/assertions';
import {processQueue} from '../infrastructure/queue/processQueue';
import convertToDripList from './convertToDripList';
import {enqueueJobs} from '../infrastructure/queue/enqueueJobs';
import batchSubLists from './batchSubLists';
import {
  verifyCanDeployEcosystem,
  getEcosystemNodes,
} from '../infrastructure/database/ecosystemRepository';
import createQueue from './createQueue';
import {deployEcosystem} from '../infrastructure/queue/finalizeDeployment';
import transitionEcosystemState from '../../../common/infrastructure/stateMachine/transitionEcosystemState';

export const handleDeployEcosystem = async ({
  body: {chainId, ownerAddress},
  params: {id},
}: DeployEcosystemRequestDto) => {
  assertIsUUID(id);
  assertIsOxString(ownerAddress);

  await verifyCanDeployEcosystem(id);

  const nodes = await getEcosystemNodes(id);
  const dripList = await convertToDripList(nodes, ownerAddress, chainId);

  await transitionEcosystemState(id, 'DEPLOYMENT_STARTED');

  // If there are no sub-lists, deploy the ecosystem directly. There is no need to enqueue jobs.
  if (dripList.subLists.length === 0) {
    void deployEcosystem({
      chainId,
      dripList,
      ecosystemId: id,
      ownerAddress,
    });

    return;
  }

  const subListBatches = batchSubLists(dripList);

  const queue = createQueue(id, chainId);

  await enqueueJobs({
    queue,
    chainId,
    ownerAddress,
    subListBatches,
    ecosystemId: id,
  });

  void processQueue(queue, dripList);

  return queue.name;
};
