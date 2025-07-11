import {z} from 'zod';
import {ECOSYSTEM_STATES} from '../../common/infrastructure/stateMachine/ecosystemStateMachine';
import {hexColorSchema} from '../../common/application/schemas';

export const getEcosystemByIdRequestSchema = z.object({
  id: z.string(),
});

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

const nodeSchema = z.object({
  projectAccountId: z.string().nullable(), // Account ID
  repoOwner: z.string(),
  repoName: z.string(),
  absoluteWeight: z.number().positive(),
});

const numericStringOrRootSchema = z.union([
  z.string().regex(/^\d+$/, 'Must be a numeric string'), // Numeric string validation
  z.literal('root'),
]);

const edgeSchema = z.object({
  source: numericStringOrRootSchema.nullable(), // Account ID
  target: numericStringOrRootSchema.nullable(), // Account ID
  weight: z.number().positive(),
});

const graphSchema = z.object({
  nodes: z.array(nodeSchema),
  edges: z.array(edgeSchema),
});

const emojiAvatarSchema = z.object({
  type: z.literal('emoji'),
  emoji: z.string(),
});

const getEcosystemByIdResponseSchema = z.object({
  id: z.string(),
  state: z.enum(ECOSYSTEM_STATES),
  accountId: z.string().nullable(),
  ownerAddress: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  metadata: metadataSchema,
  graph: graphSchema,
  avatar: emojiAvatarSchema,
  color: hexColorSchema,
});

export type GetEcosystemByIdRequestDto = z.infer<
  typeof getEcosystemByIdRequestSchema
>;

export type GetEcosystemByIdResponseDto = z.infer<
  typeof getEcosystemByIdResponseSchema
>;
