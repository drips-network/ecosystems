import {Node} from '../../../common/domain/entities.ts/Node';
import {ProjectReceiver, Receiver} from './types';
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

/**
 * Converts a flat list of nodes into a `EcosystemMainAccount` structure.
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
 * The function returns a `EcosystemMainAccount` object containing:
 * - `rawReceivers`: array of direct `ProjectReceiver` objects in the first level.
 * - `subListReceivers`: array of arrays, each representing a sub-list of `SubListReceiver` objects.
 *
 * Note that the algorithm is designed to work with max 40,000 nodes.
 *
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
  if (allNodesExceptRoot.length === 0) {
    throw new Error('No valid nodes with positive weight found.');
  }

  // Simple case: everything fits as direct receivers.
  if (allNodesExceptRoot.length <= MAX_SPLITS_RECEIVERS) {
    return normalizeEcosystemMainAccount(
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
      `Need ${subListsNeeded} sub-lists, but the Ecosystem Main Account can only reference up to ${MAX_SPLITS_RECEIVERS} account IDs.`,
    );
  }

  // Calculate distribution.
  const rawReceiversCount = MAX_SPLITS_RECEIVERS - subListsNeeded;
  const subListsCount = totalIDs - rawReceiversCount;

  // Distribute remaining accounts across sub-lists.
  const subListReceivers: ProjectReceiver[][] = [];
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

    const mapped = subListSlice
      .map(node => mapToProjectReceiver(node))
      .filter(r => r.weight > 0);
    if (mapped.length > 0) {
      subListReceivers.push(mapped);
    }

    processedAccounts += subListSlice.length;
  }

  return normalizeEcosystemMainAccount(
    {
      projectReceivers: allNodesExceptRoot
        .slice(0, rawReceiversCount)
        .map(mapToProjectReceiver)
        .filter(r => r.weight > 0),
      subListReceivers,
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
 * Returns a normalized version of the input `EcosystemMainAccount` structure.
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
 * The returned structure extends the original `EcosystemMainAccount` with:
 * - `projectReceivers`: normalized version of `rawReceivers`
 * - `subLists`: normalized version of `subListReceivers` with an additional
 *   `normalizedWeight` property that indicates the weight allocated to each sub-list.
 */

async function normalizeEcosystemMainAccount(
  root: EcosystemMainAccount,
  ownerAddress: OxString,
  chainId: ChainId,
): Promise<NormalizedEcosystemMainAccount> {
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

  const normalizedProjectReceivers = largestRemainderNormalize(
    root.projectReceivers.filter(r => r.weight > 0),
    r => r.weight,
    (r, weight) => ({...r, weight}),
  );

  const normalizedSubListRefs = largestRemainderNormalize(
    rawSubListsWeights,
    w => w,
    (_, weight) => weight,
  );

  const normalizedSubLists = root.subListReceivers.map((subList, index) => {
    return {
      receivers: normalizeSplitsReceivers(subList.filter(r => r.weight > 0)),
      normalizedWeight: normalizedSubListRefs[index],
    };
  });

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

function normalizeSplitsReceivers<T extends Receiver>(receivers: T[]): T[] {
  const filtered = receivers.filter(r => r.weight > 0);
  if (filtered.length === 0) {
    throw new Error('Cannot normalize receivers with zero total weight.');
  }

  return largestRemainderNormalize(
    filtered,
    r => r.weight,
    (r, weight) => ({...r, weight}),
  );
}

function largestRemainderNormalize<T>(
  items: T[],
  getWeight: (item: T) => number,
  setWeight: (item: T, weight: number) => T,
  total = 1_000_000,
): T[] {
  if (items.length === 0) {
    throw new Error('Cannot normalize an empty list.');
  }

  const rawTotal = items.reduce((sum, item) => sum + getWeight(item), 0);
  if (rawTotal === 0) {
    throw new Error('Total weight must not be zero.');
  }

  const idealShares = items.map(item => (getWeight(item) / rawTotal) * total);
  const flooredShares = idealShares.map(Math.floor);
  const remainders = idealShares.map((value, i) => value - flooredShares[i]);

  let remaining = total - flooredShares.reduce((sum, val) => sum + val, 0);

  const indicesByRemainder = remainders
    .map((remainder, index) => ({index, remainder}))
    .sort((a, b) => b.remainder - a.remainder)
    .map(x => x.index);

  const adjustedShares = [...flooredShares];

  // Guarantee minimum weight of 1 if item had non-zero original weight
  for (let i = 0; i < adjustedShares.length; i++) {
    if (adjustedShares[i] === 0 && getWeight(items[i]) > 0 && remaining > 0) {
      adjustedShares[i]++;
      remaining--;
    }
  }

  // Distribute remaining by remainder
  for (let i = 0; i < remaining; i++) {
    adjustedShares[indicesByRemainder[i]] += 1;
  }

  return items.map((item, i) => setWeight(item, adjustedShares[i]));
}
