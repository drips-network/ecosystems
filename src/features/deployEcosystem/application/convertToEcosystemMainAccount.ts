import {Node} from '../../../common/domain/entities.ts/Node';
import {ProjectReceiver, DeadlineReceiver} from './types';
import {logger} from '../../../common/infrastructure/logger';
import unreachable from '../../../common/application/unreachable';
import {AccountId, ChainId, OxString} from '../../../common/domain/types';
import calculateRandomSalt from '../infrastructure/blockchain/calculateRandomSalt';
import {executeNftDriverReadMethod} from '../../../common/infrastructure/contracts/nftDriver/nftDriver';
import getWallet from '../../../common/infrastructure/contracts/getWallet';
import {executeRepoDeadlineDriverReadMethod} from '../../../common/infrastructure/contracts/repoDeadlineDriver/repoDeadlineDriver';
import {executeRepoSubAccountDriverReadMethod} from '../../../common/infrastructure/contracts/repoSubAccountDriver/repoSubAccountDriver';
import {toBigInt} from 'ethers';

type Receiver = ProjectReceiver | DeadlineReceiver; // In the future, we may allow `SubListReceiver` types as well.

type EcosystemMainAccount = {
  projectReceivers: Receiver[];
  subListReceivers: Receiver[][];
};

type NormalizedSubList = {
  receivers: Receiver[];
  normalizedWeight: number;
};

export type NormalizedEcosystemMainAccount = {
  salt: bigint;
  accountId: AccountId;
  subLists: NormalizedSubList[];
  projectReceivers: (ProjectReceiver | DeadlineReceiver)[];
};

const MAX_SPLITS_RECEIVERS = 2; // Hardcoded in Drips contracts.
const MAX_NUMBER_OF_NODES = 40000; // Calculated based on `MAX_SPLITS_RECEIVERS`.
const NORMALIZATION_TARGET = 1_000_000;

/**
 * Helper to normalize a list of weights ensuring every entry gets at least 1
 * and the total equals NORMALIZATION_TARGET.
 */
function normalizeWeights(
  weights: number[],
  target: number = NORMALIZATION_TARGET,
): number[] {
  const n = weights.length;
  if (n === 0) return [];
  // Guard: Ensure total raw weight > 0.
  const totalRaw = weights.reduce((sum, w) => sum + w, 0);
  if (totalRaw === 0) {
    throw new Error('Cannot normalize weights: total raw weight is 0.');
  }
  // Each entry gets at least 1.
  const base = 1;
  const remainingTarget = target - n;
  const prelim = weights.map(w => Math.floor((w / totalRaw) * remainingTarget));
  const baseAllocations = prelim.map(p => p + base);
  let allocated = baseAllocations.reduce((sum, a) => sum + a, 0);
  const diff = target - allocated;
  // Compute fractional remainders for each weight.
  const fractions = weights.map(
    w =>
      (w / totalRaw) * remainingTarget -
      Math.floor((w / totalRaw) * remainingTarget),
  );
  // Distribute any remaining weight one by one to those with the highest fraction.
  const indicesSorted = Array.from({length: n}, (_, i) => i).sort(
    (i, j) => fractions[j] - fractions[i],
  );
  for (let i = 0; i < diff; i++) {
    baseAllocations[indicesSorted[i]] += 1;
  }
  allocated = baseAllocations.reduce((sum, a) => sum + a, 0);
  if (allocated !== target) {
    logger.error(
      `Normalization error: allocated total ${allocated} does not equal target ${target}.`,
    );
    throw new Error('Normalization failed to meet target.');
  }
  baseAllocations.forEach((w, i) => {
    if (w < 1) {
      logger.error(
        `Normalized weight for index ${i} is ${w}. Expected at least 1.`,
      );
      throw new Error('A normalized weight ended up as zero or negative.');
    }
  });
  return baseAllocations;
}

/**
 * Converts a flat list of nodes into a `EcosystemMainAccount` structure.
 * This function organizes nodes according to the following constraints:
 * 1. No level can contain more than `MAX_SPLITS_RECEIVERS` total slots.
 * 2. The first level can contain both direct receivers and sub-list references.
 * 3. Sub-lists can only contain direct receivers.
 *
 * The algorithm works as follows:
 * 1. If all nodes fit within `MAX_SPLITS_RECEIVERS`, creates a single level with no sub-lists.
 * 2. Otherwise:
 *
 *    a. Calculates minimum number of sub-lists (x) needed using the formula:
 *       x = ceil((totalIDs - `MAX_SPLITS_RECEIVERS`) / (`MAX_SPLITS_RECEIVERS` - 1))
 *
 *    b. Reserves x slots in the first level for sub-list references.
 *
 *    c. Uses remaining (`MAX_SPLITS_RECEIVERS` - x) slots for direct receivers in the first level.
 *
 *    d. Distributes remaining nodes across sub-lists.
 *
 * The function returns a `NormalizedEcosystemMainAccount` object.
 */
export default async function convertToEcosystemMainAccount(
  nodes: Node[],
  chainId: ChainId,
  deadline: Date | null,
  refundAccountId: AccountId | null,
): Promise<NormalizedEcosystemMainAccount> {
  if (nodes.length > MAX_NUMBER_OF_NODES) {
    throw new Error(
      `Too many nodes provided while converting ecosystem nodes to Ecosystem Main Account. Max allowed is ${MAX_NUMBER_OF_NODES}.`,
    );
  }

  const rootNode = nodes.find(node => node.projectName === 'root');
  if (!rootNode) {
    unreachable('Root node is missing.');
  }

  // Filter out the root node and any node with an absolute weight of 0.
  const allNodesExceptRoot = nodes.filter(
    node => node.projectName !== 'root' && node.absoluteWeight > 0,
  ) as (Node & {projectAccountId: string; url: string})[];

  if (allNodesExceptRoot.length === 0) {
    throw new Error('No valid nodes with positive weight found.');
  }

  // Simple case: everything fits as direct receivers.
  if (allNodesExceptRoot.length <= MAX_SPLITS_RECEIVERS) {
    return normalizeEcosystemMainAccount(
      {
        projectReceivers: await Promise.all(
          allNodesExceptRoot.map(node =>
            mapToReceiver(node, chainId, deadline, refundAccountId),
          ),
        ),
        subListReceivers: [],
      },
      chainId,
    );
  }

  // Calculate minimum number of sub-lists needed.
  const totalIDs = allNodesExceptRoot.length;
  const subListsNeeded = Math.ceil(
    (totalIDs - MAX_SPLITS_RECEIVERS) / (MAX_SPLITS_RECEIVERS - 1),
  );

  if (subListsNeeded > MAX_SPLITS_RECEIVERS) {
    throw new Error(
      `Need ${subListsNeeded} sub-lists, but the Ecosystem Main Account can only reference up to ${MAX_SPLITS_RECEIVERS} account IDs.`,
    );
  }

  const rawReceiversCount = MAX_SPLITS_RECEIVERS - subListsNeeded;
  const subListsCount = totalIDs - rawReceiversCount;

  const subListReceivers: Receiver[][] = [];
  let processedAccounts = 0;
  while (processedAccounts < subListsCount) {
    const start = processedAccounts;
    const end = Math.min(start + MAX_SPLITS_RECEIVERS, subListsCount);
    const subListSlice = allNodesExceptRoot.slice(
      rawReceiversCount + start,
      rawReceiversCount + end,
    );
    if (subListSlice.length > 0) {
      subListReceivers.push(
        await Promise.all(
          subListSlice.map(node =>
            mapToReceiver(node, chainId, deadline, refundAccountId),
          ),
        ),
      );
    }
    processedAccounts += subListSlice.length;
  }

  return normalizeEcosystemMainAccount(
    {
      projectReceivers: await Promise.all(
        allNodesExceptRoot
          .slice(0, rawReceiversCount)
          .map(node => mapToReceiver(node, chainId, deadline, refundAccountId)),
      ),
      subListReceivers,
    },
    chainId,
  );
}

async function mapToReceiver(
  node: Node & {projectAccountId: string; url: string},
  chainId: ChainId,
  deadline: Date | null,
  refundAccountId: AccountId | null,
): Promise<Receiver> {
  const [ownerName, repoName] = node.projectName.includes('/')
    ? node.projectName.split('/')
    : unreachable('Invalid project name format.');

  const projectReceiver: ProjectReceiver = {
    accountId: node.projectAccountId,
    weight: node.absoluteWeight,
    type: 'repoSubAccountDriver',
    source: {
      url: node.url,
      forge: 'github',
      ownerName,
      repoName,
    },
  };

  // If no deadline is configured, return the project receiver directly.
  if (!deadline || !refundAccountId) {
    return projectReceiver;
  }

  // Calculate the RepoDriver accountId from the RepoSubAccountDriver accountId.
  const repoAccountId = (
    await executeRepoSubAccountDriverReadMethod({
      functionName: 'calcAccountId',
      args: [toBigInt(projectReceiver.accountId)],
      chainId,
    })
  ).toString() as AccountId;

  // Convert deadline to Unix timestamp (seconds).
  const deadlineTimestamp = toBigInt(Math.floor(deadline.getTime() / 1000));

  // Calculate the DeadlineDriver account ID.
  const deadlineAccountId = (
    await executeRepoDeadlineDriverReadMethod({
      functionName: 'calcAccountId',
      args: [
        toBigInt(repoAccountId),
        toBigInt(projectReceiver.accountId),
        toBigInt(refundAccountId),
        Number(deadlineTimestamp),
      ],
      chainId,
    })
  ).toString() as AccountId;

  // Ensure the source is GitHub for deadline receivers.
  if (projectReceiver.source.forge !== 'github') {
    unreachable('Deadline receivers are only supported for GitHub projects.');
  }

  const deadlineReceiver: DeadlineReceiver = {
    type: 'deadline',
    weight: projectReceiver.weight,
    accountId: deadlineAccountId,
    claimableProject: {
      accountId: repoAccountId,
      source: projectReceiver.source,
    },
    recipientAccountId: projectReceiver.accountId,
    refundAccountId,
    deadline,
  };

  return deadlineReceiver;
}

/**
 * Returns a normalized version of the input `EcosystemMainAccount` structure.
 */
async function normalizeEcosystemMainAccount(
  root: EcosystemMainAccount,
  chainId: ChainId,
): Promise<NormalizedEcosystemMainAccount> {
  // 1. Compute raw weights.
  const projectWeights = root.projectReceivers.map(r => r.weight);
  const rawReceiversTotal = projectWeights.reduce((sum, w) => sum + w, 0);

  // For sub-lists, sum the weights in each sub-list.
  const subListWeights = root.subListReceivers.map(subList =>
    subList.reduce((sum, r) => sum + r.weight, 0),
  );

  // Combined normalization at root level.
  const combinedWeights = [...projectWeights, ...subListWeights];
  const normalizedCombined = normalizeWeights(combinedWeights);
  const normalizedProjectWeights = normalizedCombined.slice(
    0,
    projectWeights.length,
  );
  const normalizedSubListWeights = normalizedCombined.slice(
    projectWeights.length,
  );

  const normalizedProjectReceivers = root.projectReceivers.map((r, i) => ({
    ...r,
    weight: normalizedProjectWeights[i],
  }));

  // Normalize each sub-list internally.
  const normalizedSubLists = root.subListReceivers.map((subList, index) => {
    const subWeights = subList.map(r => r.weight);
    const rawSubTotal = subWeights.reduce((sum, w) => sum + w, 0);
    const normalizedSubWeights = normalizeWeights(subWeights);
    const normalizedSubTotal = normalizedSubWeights.reduce(
      (sum, w) => sum + w,
      0,
    );
    const receivers = subList.map((r, i) => ({
      ...r,
      weight: normalizedSubWeights[i],
    }));
    return {
      receivers,
      normalizedWeight: normalizedSubListWeights[index],
      // Additional info for each sub-list.
      rawSubTotal,
      normalizedSubTotal,
    } as NormalizedSubList & {rawSubTotal: number; normalizedSubTotal: number};
  });

  // Prepare final aggregated info for root level.
  const rootNormalizedProjectTotal = normalizedProjectWeights.reduce(
    (sum, w) => sum + w,
    0,
  );
  const rootNormalizedSubTotal = normalizedSubListWeights.reduce(
    (sum, w) => sum + w,
    0,
  );
  const rootCombinedTotal = rootNormalizedProjectTotal + rootNormalizedSubTotal;

  logger.info(`
──────────────────────────────────────────────
Root-Level Normalization Summary:
  - Raw receivers total weight: ${rawReceiversTotal} (normalized: ${rootNormalizedProjectTotal}).
  - For each Sub-List (index: raw total | normalized root weight | normalized internal total):
    ${normalizedSubLists
      .map(
        (s, i) =>
          `Sub-List ${i}: ${subListWeights[i]} | ${normalizedSubListWeights[i]} | ${s.normalizedSubTotal}`,
      )
      .join('\n    ')}
  - Combined root-level total (should equal ${NORMALIZATION_TARGET}): ${rootCombinedTotal}.
──────────────────────────────────────────────
`);

  const salt = calculateRandomSalt();
  const deployerAddress = getWallet(chainId).address as OxString;
  const dripListId = (
    await executeNftDriverReadMethod({
      functionName: 'calcTokenIdWithSalt',
      args: [deployerAddress, salt],
      chainId,
    })
  ).toString() as AccountId;

  return {
    salt,
    accountId: dripListId,
    projectReceivers: normalizedProjectReceivers,
    subLists: normalizedSubLists.map(s => ({
      receivers: s.receivers,
      normalizedWeight: s.normalizedWeight,
    })),
  };
}
