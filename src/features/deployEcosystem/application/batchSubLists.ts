import {NormalizedEcosystemMainAccount} from './convertToEcosystemMainAccount';
import {Receiver} from './types';

export type SubList = {
  receivers: Receiver[];
  weight: number;
};

export default function batchSubLists(
  ecosystemMainAccount: NormalizedEcosystemMainAccount,
): SubList[][] {
  const totalImmutableSplitsCreationTxs = ecosystemMainAccount.subLists.length;

  // TODO: For now we split into batches of 20. To be improved if needed.
  const batches: SubList[][] = [];
  for (let i = 0; i < totalImmutableSplitsCreationTxs; i += 20) {
    batches.push(
      ecosystemMainAccount.subLists.slice(i, i + 20).map(p => ({
        receivers: p.receivers,
        weight: p.normalizedWeight,
      })),
    );
  }

  return batches;
}
