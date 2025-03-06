import {z} from 'zod';
import {nftDriverAccountMetadataSchemaV5} from './v5';
import {
  addressDriverSplitReceiverSchema,
  repoDriverSplitReceiverSchema,
} from '../repo-driver/v2';
import {subListSplitReceiverSchema} from '../subList/v1';

export const nftDriverAccountMetadataSchemaV6 =
  nftDriverAccountMetadataSchemaV5.extend({
    projects: z
      .array(
        z.union([
          repoDriverSplitReceiverSchema,
          addressDriverSplitReceiverSchema,
        ]),
      )
      .optional(),
    recipients: z.array(
      z.union([repoDriverSplitReceiverSchema, subListSplitReceiverSchema]),
    ),
    isVisible: z.literal(true),
    isDripList: z.boolean().optional(),
    type: z.union([z.literal('ecosystem'), z.literal('drip-list')]),
  });
