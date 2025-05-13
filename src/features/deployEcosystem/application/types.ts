import z from 'zod';
import {dripListSplitReceiverSchema} from '../../../common/infrastructure/metadata/schemas/nft-driver/v2';
import {addressDriverSplitReceiverSchema} from '../../../common/infrastructure/metadata/schemas/repo-driver/v2';
import {subListSplitReceiverSchema} from '../../../common/infrastructure/metadata/schemas/immutable-splits-driver/v1';
import {repoSubAccountDriverSplitReceiverSchema} from '../../../common/infrastructure/metadata/schemas/common/repoSubAccountDriverSplitReceiverSchema';

export type TransactionExecutionStrategy<TContext, TResult> = {
  executeTx: (context: TContext) => Promise<TResult>;
};

export type ProjectReceiver = z.infer<
  typeof repoSubAccountDriverSplitReceiverSchema
>;
export type SubListReceiver = z.infer<typeof subListSplitReceiverSchema>;
export type DripListReceiver = z.infer<typeof dripListSplitReceiverSchema>;
export type AddressReceiver = z.infer<typeof addressDriverSplitReceiverSchema>;
export type Receiver =
  | ProjectReceiver
  | SubListReceiver
  | DripListReceiver
  | AddressReceiver;
