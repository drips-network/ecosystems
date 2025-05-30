import {z} from 'zod';
import {repoDriverAccountMetadataSchemaV3} from './v3';

export const emojiAvatarSchema = z.object({
  type: z.literal('emoji'),
  emoji: z.string(),
});

const imageAvatarSchema = z.object({
  type: z.literal('image'),
  cid: z.string(),
});

export const repoDriverAccountMetadataSchemaV4 =
  repoDriverAccountMetadataSchemaV3.extend({
    emoji: z.undefined().optional(),
    avatar: z.union([emojiAvatarSchema, imageAvatarSchema]),
  });
