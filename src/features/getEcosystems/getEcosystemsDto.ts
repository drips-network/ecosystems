import {z} from 'zod';
import {ECOSYSTEM_STATES} from '../../common/infrastructure/stateMachine/ecosystemStateMachine';
import {hexColorSchema} from '../../common/application/schemas';

const metadataSchema = z.array(
  z.object({
    icon: z.string(),
    title: z.string(),
    text: z.string().optional(),
    link: z
      .object({
        href: z.string(),
        label: z.string(),
      })
      .optional(),
  }),
);

const emojiAvatarSchema = z.object({
  type: z.literal('emoji'),
  emoji: z.string(),
});

const ecosystemSchema = z.object({
  id: z.string(),
  accountId: z.string().nullable(),
  ownerAddress: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  nodeCount: z.number().nullable(),
  metadata: metadataSchema,
  state: z.enum(ECOSYSTEM_STATES),
  avatar: emojiAvatarSchema,
  color: hexColorSchema,
});

const getEcosystemsResponseSchema = z.array(ecosystemSchema);

export type GetEcosystemsResponseDto = z.infer<
  typeof getEcosystemsResponseSchema
>;

export type MetadataDto = z.infer<typeof metadataSchema>;
