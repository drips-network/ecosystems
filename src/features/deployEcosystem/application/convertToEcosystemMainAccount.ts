import {Node} from '../../../common/domain/entities.ts/Node';
import {ProjectReceiver, Receiver} from './types';
import {logger} from '../../../common/infrastructure/logger';
import unreachable from '../../../common/application/unreachable';
import {AccountId, ChainId, OxString} from '../../../common/domain/types';
import calculateRandomSalt from '../infrastructure/blockchain/calculateRandomSalt';
import {executeNftDriverReadMethod} from '../../../common/infrastructure/contracts/nftDriver/nftDriver';
import getWallet from '../../../common/infrastructure/contracts/getWallet';

type EcosystemMainAccount = {
  projectReceivers: ProjectReceiver[];
  subListReceivers: ProjectReceiver[][]; // In the future, we may allow `SubListReceiver` types as well.
};

type NormalizedSubList = {
  receivers: ProjectReceiver[];
  normalizedWeight: number;
};

export type NormalizedEcosystemMainAccount = {
  salt: bigint;
  accountId: AccountId;
  subLists: NormalizedSubList[];
  projectReceivers: ProjectReceiver[];
};

// The `EcosystemMainAccount` structure has a two-level design:
//  - Level 1: Contains both direct project receivers and references to sub-lists.
//  - Level 2: Contains sub-lists of additional receivers.
// The structure is limited by `MAX_SPLITS_RECEIVERS` per level:
// 200 (sub-lists) × 200 (receivers per sub-list) = 40,000 accounts
const MAX_SPLITS_RECEIVERS = 200; // Hardcoded in Drips contracts.
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
  // Debug: Ensure no weight is zero.
  baseAllocations.forEach((w, i) => {
    if (w <= 0) {
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
  ownerAddress: OxString,
  chainId: ChainId,
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

  // Verify and log if any node had zero weight (they should be filtered out).
  if (allNodesExceptRoot.length === 0) {
    throw new Error('No valid nodes with positive weight found.');
  } else {
    logger.debug(
      `Filtered nodes: kept ${allNodesExceptRoot.length} entries with positive weight.`,
    );
  }

  // Simple case: everything fits as direct receivers.
  if (allNodesExceptRoot.length <= MAX_SPLITS_RECEIVERS) {
    return normalizeEcosystemMainAccount(
      {
        projectReceivers: allNodesExceptRoot.map(mapToProjectReceiver),
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

  // Validate that we can fit the required number of sub-lists.
  if (subListsNeeded > MAX_SPLITS_RECEIVERS) {
    throw new Error(
      `Need ${subListsNeeded} sub-lists, but the Ecosystem Main Account can only reference up to ${MAX_SPLITS_RECEIVERS} account IDs.`,
    );
  }

  // Calculate distribution.
  const rawReceiversCount = MAX_SPLITS_RECEIVERS - subListsNeeded;
  const subListsCount = totalIDs - rawReceiversCount;

  // Distribute remaining accounts across sub-lists.
  const subListReceivers: ProjectReceiver[][] = [];
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
        subListSlice.map(node => mapToProjectReceiver(node)),
      );
    }
    processedAccounts += subListSlice.length;
  }

  return normalizeEcosystemMainAccount(
    {
      projectReceivers: allNodesExceptRoot
        .slice(0, rawReceiversCount)
        .map(mapToProjectReceiver),
      subListReceivers,
    },
    chainId,
  );
}

function mapToProjectReceiver(
  node: Node & {projectAccountId: string; url: string},
): ProjectReceiver {
  const [ownerName, repoName] = node.projectName.includes('/')
    ? node.projectName.split('/')
    : unreachable('Invalid project name format.');
  return {
    accountId: node.projectAccountId,
    weight: node.absoluteWeight,
    type: 'repoDriver',
    source: {
      url: node.url,
      forge: 'github',
      ownerName,
      repoName,
    },
  };
}

/**
 * Returns a normalized version of the input `EcosystemMainAccount` structure.
 *
 * Normalization is done at two levels:
 *
 * 1. At the root level, we normalize both direct receivers and sub-list references.
 *    Instead of the simple Math.floor approach, we now use the normalization helper
 *    to guarantee every entry receives at least 1 and the total sum equals NORMALIZATION_TARGET.
 *
 * 2. For each sub-list, we perform a separate normalization using the same helper.
 *
 * Debug logs and guards are added to flag any issues.
 */
async function normalizeEcosystemMainAccount(
  root: EcosystemMainAccount,
  chainId: ChainId,
): Promise<NormalizedEcosystemMainAccount> {
  // 1. Compute raw weights.
  const rawReceiversTotalWeight = root.projectReceivers.reduce(
    (sum, r) => sum + r.weight,
    0,
  );
  const rawSubListsWeights = root.subListReceivers.map(subList =>
    subList.reduce((sum, r) => sum + r.weight, 0),
  );
  const totalRaw =
    rawReceiversTotalWeight + rawSubListsWeights.reduce((sum, w) => sum + w, 0);

  if (totalRaw === 0) {
    throw new Error('Total weight at root cannot be zero.');
  }

  // Prepare weights for normalization.
  const projectWeights = root.projectReceivers.map(r => r.weight);
  const subListWeights = rawSubListsWeights;

  // Normalize weights for direct receivers.
  const normalizedProjectWeights = normalizeWeights(projectWeights);
  // Normalize weights for each sub-list reference.
  const normalizedSubListWeights = normalizeWeights(subListWeights);

  // Debug: Log normalization summaries.
  logger.debug(
    `Normalized root-level weights for ${root.projectReceivers.length} direct receivers: ${normalizedProjectWeights}.`,
  );
  logger.debug(
    `Normalized root-level weights for ${root.subListReceivers.length} sub-list references: ${normalizedSubListWeights}.`,
  );

  // Map normalized weights back to project receivers.
  const normalizedProjectReceivers = root.projectReceivers.map((r, i) => ({
    ...r,
    weight: normalizedProjectWeights[i],
  }));

  // Normalize each sub-list separately.
  const normalizedSubLists = root.subListReceivers.map((subList, index) => {
    // Get the raw weights for this sub-list.
    const subWeights = subList.map(r => r.weight);
    const normalizedWeights = normalizeWeights(subWeights);
    const receivers = subList.map((r, i) => ({
      ...r,
      weight: normalizedWeights[i],
    }));
    // Debug log for each sub-list.
    logger.debug(
      `Sub-list ${index} normalized weights: ${normalizedWeights}. Total: ${normalizedWeights.reduce((sum, w) => sum + w, 0)}.`,
    );
    return {
      receivers,
      normalizedWeight: normalizedSubListWeights[index],
    };
  });

  // 2. Prepare final data needed to deploy.
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
    subLists: normalizedSubLists,
  };
}
