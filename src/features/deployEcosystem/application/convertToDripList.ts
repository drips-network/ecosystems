import {Node} from '../../../common/domain/entities.ts/Node';
import {ProjectReceiver, Receiver, SubListReceiver} from './types';
import {logger} from '../../../common/infrastructure/logger';
import unreachable from '../../../common/application/unreachable';
import {AccountId, ChainId, OxString} from '../../../common/domain/types';
import calculateRandomSalt from '../infrastructure/blockchain/calculateRandomSalt';
import {executeNftDriverReadMethod} from '../../../common/infrastructure/contracts/nftDriver/nftDriver';
import getWallet from '../../../common/infrastructure/contracts/getWallet';

type DripList = {
  projectReceivers: ProjectReceiver[];
  subListReceivers: SubListReceiver[][];
};

type NormalizedSubList = {
  receivers: SubListReceiver[];
  normalizedWeight: number;
};

export type NormalizedDripList = {
  salt: bigint;
  accountId: AccountId;
  subLists: NormalizedSubList[];
  projectReceivers: ProjectReceiver[];
};

// The DripList structure has a two-level design:
//  - Level 1: Contains both direct project receivers and references to sub-lists.
//  - Level 2: Contains sub-lists of additional receivers.
// The structure is limited by `MAX_SPLITS_RECEIVERS` per level:
// 200 (sub-lists) × 200 (receivers per sub-list) = 40,000 accounts
const MAX_SPLITS_RECEIVERS = 200; // Hardcoded in Drips contracts.
const MAX_NUMBER_OF_NODES = 40000; // Calculated based on `MAX_SPLITS_RECEIVERS`.

/**
 * Converts a flat list of nodes into a `DripList` structure.
 * This function organizes nodes according to the following constraints:
 * 1. No level can contain more than `MAX_SPLITS_RECEIVERS` total slots.
 * 2. The first level can contain both direct receivers and sub-list references.
 * 3. Sub-lists can only contain direct receivers.
 *
 * The algorithm works as follows:
 * 1. If all nodes fit within `MAX_SPLITS_RECEIVERS`, creates a single level with no sub-lists
 * 2. Otherwise:
 *
 *    a. Calculates minimum number of sub-lists (x) needed using the formula:
 *       x = ceil((totalIDs - `MAX_SPLITS_RECEIVERS`) / (`MAX_SPLITS_RECEIVERS` - 1))
 *
 *    b. Reserves x slots in the first level for sub-list references
 *
 *    c. Uses remaining (`MAX_SPLITS_RECEIVERS` - x) slots for direct receivers in the first level
 *
 *    d. Distributes remaining nodes across sub-lists
 *
 * The function returns a `DripList` object containing:
 * - `rawReceivers`: array of direct `ProjectReceiver` objects in the first level.
 * - `subListReceivers`: array of arrays, each representing a sub-list of `SubListReceiver` objects.
 *
 * Note that the algorithm is designed to work with max 40,000 nodes.
 *
 */
export default async function convertToDripList(
  nodes: Node[],
  ownerAddress: OxString,
  chainId: ChainId,
): Promise<NormalizedDripList> {
  if (nodes.length > MAX_NUMBER_OF_NODES) {
    throw new Error(
      `Too many nodes provided while converting ecosystem nodes to Drip List. Max allowed is ${MAX_NUMBER_OF_NODES}.`,
    );
  }

  const allNodesExceptRoot = nodes.filter(
    node => node.projectName !== 'root',
  ) as (Node & {projectAccountId: string; url: string})[];

  if (allNodesExceptRoot.length !== nodes.length - 1) {
    // Excluding the `root` node.
    unreachable(
      'Found invalid nodes structure while converting ecosystem to Drip List.',
    );
  }

  // Simple case: everything fits as direct receivers.
  if (allNodesExceptRoot.length <= MAX_SPLITS_RECEIVERS) {
    return normalizeDripList(
      {
        projectReceivers: allNodesExceptRoot.map(mapToProjectReceiver),
        subListReceivers: [],
      },
      ownerAddress,
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
      `Need ${subListsNeeded} sub-lists, but the Drip List can only reference up to ${MAX_SPLITS_RECEIVERS} account IDs.`,
    );
  }

  // Calculate distribution.
  const rawReceiversCount = MAX_SPLITS_RECEIVERS - subListsNeeded;
  const subListsCount = totalIDs - rawReceiversCount;

  // Distribute remaining accounts across sub-lists.
  const subLists: SubListReceiver[][] = [];
  let processedAccounts = 0;

  // Loop until all sub-list nodes are processed.
  while (processedAccounts < subListsCount) {
    const start = processedAccounts;
    // Ensure we do not exceed the remaining nodes.
    const end = Math.min(start + MAX_SPLITS_RECEIVERS, subListsCount);

    // Extract the slice for the current sub-list.
    const subListSlice = allNodesExceptRoot.slice(
      rawReceiversCount + start,
      rawReceiversCount + end,
    );

    // Only add non-empty sub-lists.
    if (subListSlice.length > 0) {
      subLists.push(
        subListSlice.map(node => ({
          accountId: node.projectAccountId,
          weight: node.absoluteWeight,
          type: 'sub-list',
        })),
      );
    }

    processedAccounts += subListSlice.length;
  }

  return normalizeDripList(
    {
      projectReceivers: allNodesExceptRoot
        .slice(0, rawReceiversCount)
        .map(mapToProjectReceiver),
      subListReceivers: subLists,
    },
    ownerAddress,
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
 * Returns a normalized version of the input `DripList` structure.
 *
 * This function performs weight normalization at two levels:
 *
 * 1. At the first level, it calculates a normalized weight for:
 *    - Each direct receiver in the `rawReceivers` array.
 *    - Each sub-list reference (based on the aggregate weight of its receivers).
 *
 *    The sum of these normalized weights will be exactly 1000000.
 *
 *
 * 2. For each sub-list in the `subListReceivers` array, it normalizes its receivers
 *    so that they sum to 1000000.
 *
 * The returned structure extends the original `DripList` with:
 * - `projectReceivers`: normalized version of `rawReceivers`
 * - `subLists`: normalized version of `subListReceivers` with an additional
 *   `normalizedWeight` property that indicates the weight allocated to each sub-list.
 */
async function normalizeDripList(
  root: DripList,
  ownerAddress: OxString,
  chainId: ChainId,
): Promise<NormalizedDripList> {
  // 1. Compute the raw receivers' weight (root level).
  //    This includes the weights of raw 'project' receivers...
  const rawReceiversTotalWeight = root.projectReceivers.reduce(
    (sum, r) => sum + r.weight,
    0,
  );

  //    ...plus, for each sub-list, the total weight of its receivers (before normalization).
  const rawSubListsWeights = root.subListReceivers.map(subList =>
    subList.reduce((sum, r) => sum + r.weight, 0),
  );

  const totalRaw =
    rawReceiversTotalWeight + rawSubListsWeights.reduce((sum, w) => sum + w, 0);
  if (totalRaw === 0) {
    throw new Error('Total weight at root cannot be zero.');
  }

  // 2. Compute normalized weights for the root-level "slots".
  //    For direct 'project' receivers:
  const normalizedProjectReceivers = root.projectReceivers.map(
    r =>
      ({
        ...r,
        weight: Math.floor((r.weight / totalRaw) * 1_000_000),
      }) as ProjectReceiver,
  );

  //    For each sub-list reference, calculate a normalized weight.
  const normalizedSubListRefs = rawSubListsWeights.map(subListRaw =>
    Math.floor((subListRaw / totalRaw) * 1_000_000),
  );

  // Adjust for rounding differences at the root level.
  const rootSlotsTotal =
    normalizedProjectReceivers.reduce((sum, r) => sum + r.weight, 0) +
    normalizedSubListRefs.reduce((sum, w) => sum + w, 0);
  const rootDiff = 1_000_000 - rootSlotsTotal;
  if (normalizedSubListRefs.length > 0) {
    logger.warn(
      `Total weights must add up to 1,000,000, but they add up to ${rootSlotsTotal}. Rounding up...`,
    );

    normalizedSubListRefs[normalizedSubListRefs.length - 1] += rootDiff;

    logger.warn(`Rounded up the last sub-list's weight by ${rootDiff}.`);
  } else if (normalizedProjectReceivers.length > 0) {
    logger.warn(
      `Total weights must add up to 1,000,000, but they add up to ${rootSlotsTotal}. Rounding up...`,
    );

    normalizedProjectReceivers[normalizedProjectReceivers.length - 1].weight +=
      rootDiff;

    logger.warn(`Rounded up the last root receiver's weight by ${rootDiff}.`);
  }

  // 3. Normalize each sub-list receivers separately.
  const normalizedSubLists = root.subListReceivers.map((subList, index) => {
    return {
      receivers: normalizeSplitsReceivers(subList),
      // Attach the normalized weight for the sub-list at the root (Drip List) level.
      normalizedWeight: normalizedSubListRefs[index],
    };
  });

  // 4. Return the new tree with normalized raw 'project' receivers and normalized sub-lists.
  // Note: The `normalizedWeight` property is added for root-level allocation only.

  const salt = calculateRandomSalt();
  const deployerAddress = getWallet(chainId).address as OxString;
  const dripListId = (
    await executeNftDriverReadMethod({
      functionName: 'calcTokenIdWithSalt',
      args: [deployerAddress, salt],
      chainId,
    })
  ).toString();

  return {
    salt,
    accountId: dripListId,
    projectReceivers: normalizedProjectReceivers,
    subLists: normalizedSubLists,
  };
}

function normalizeSplitsReceivers<T extends Receiver>(receivers: T[]): T[] {
  const totalWeight = receivers.reduce((sum, r) => sum + r.weight, 0);
  if (totalWeight === 0) {
    throw new Error('Total weight cannot be zero.');
  }

  const normalized = receivers.map(r => ({
    ...r,
    weight: Math.floor((r.weight / totalWeight) * 1_000_000),
  })) as T[];

  // Fix any rounding error by adjusting the last receiver.
  const diff = 1_000_000 - normalized.reduce((sum, r) => sum + r.weight, 0);
  if (normalized.length > 0) {
    normalized[normalized.length - 1].weight += diff;
  }

  const total = normalized.reduce((sum, r) => sum + r.weight, 0);
  if (total !== 1_000_000) {
    throw new Error(`Total weight is ${total} instead of 1,000,000.`);
  }

  return normalized;
}
