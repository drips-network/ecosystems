import {DeployEcosystemRequestDto} from '../api/deployEcosystemDto';
import {
  assertIsOxString,
  assertIsUUID,
} from '../../../common/application/assertions';
import {processQueue} from '../infrastructure/queue/processQueue';
import convertToEcosystemMainAccount from './convertToEcosystemMainAccount';
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
  const ecosystemMainAccount = await convertToEcosystemMainAccount(
    nodes,
    ownerAddress,
    chainId,
  );

  await transitionEcosystemState(id, 'DEPLOYMENT_STARTED');

  // If there are no sub-lists, deploy the ecosystem directly. There is no need to enqueue jobs.
  if (ecosystemMainAccount.subLists.length === 0) {
    void deployEcosystem({
      chainId,
      ecosystemMainAccount,
      ecosystemId: id,
      ownerAddress,
    });

    return;
  }

  const subListBatches = batchSubLists(ecosystemMainAccount);

  const queue = createQueue(id, chainId);

  await enqueueJobs({
    queue,
    chainId,
    ownerAddress,
    subListBatches,
    ecosystemId: id,
  });

  void processQueue(queue, ecosystemMainAccount);

  return queue.name;
};
