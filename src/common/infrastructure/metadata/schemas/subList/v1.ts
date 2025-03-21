import z from 'zod';
import {
  addressDriverSplitReceiverSchema,
  repoDriverSplitReceiverSchema,
} from '../repo-driver/v2';
import {dripListSplitReceiverSchema} from '../nft-driver/v2';

export const subListSplitReceiverSchema = z.object({
  type: z.literal('sub-list'),
  weight: z.number(),
  accountId: z.string(),
});

export const subListMetadataSchemaV1 = z.object({
  driver: z.literal('immutable-splits'),
  type: z.literal('sub-list'),
  recipients: z.array(
    z.union([
      addressDriverSplitReceiverSchema,
      dripListSplitReceiverSchema,
      repoDriverSplitReceiverSchema,
      subListSplitReceiverSchema,
    ]),
  ),
  parent: z.object({
    driver: z.literal('nft'),
    accountId: z.string(),
  }),
});
