import {z} from 'zod';
import {ECOSYSTEM_STATES} from '../../infrastructure/stateMachine/ecosystemStateMachine';

export const getEcosystemByIdRequestSchema = z.object({
  id: z.string().uuid(),
});

const metadataSchema = z.array(
  z.object({
    icon: z.string(),
    title: z.string(),
    text: z.string().optional(),
    link: z.object({
      href: z.string(),
      label: z.string(),
    }),
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

const getEcosystemByIdResponseSchema = z.object({
  id: z.string(),
  state: z.enum(ECOSYSTEM_STATES),
  accountId: z.string().nullable(),
  name: z.string(),
  description: z.string().nullable().optional(),
  metadata: metadataSchema,
  graph: graphSchema,
});

export type GetEcosystemByIdRequestDto = z.infer<
  typeof getEcosystemByIdRequestSchema
>;

export type GetEcosystemByIdResponseDto = z.infer<
  typeof getEcosystemByIdResponseSchema
>;
