import {object, z} from 'zod';
import {ECOSYSTEM_STATES} from '../../infrastructure/stateMachine/ecosystemStateMachine';

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

const ecosystemSchema = z.object({
  id: z.string(),
  accountId: z.string().nullable(),
  name: z.string(),
  description: z.string().nullable().optional(),
  nodeCount: z.number(),
  metadata: metadataSchema,
  state: z.enum(ECOSYSTEM_STATES),
});

const getEcosystemsResponseSchema = z.array(ecosystemSchema);

export type GetEcosystemsResponseDto = z.infer<
  typeof getEcosystemsResponseSchema
>;

export type MetadataDto = z.infer<typeof metadataSchema>;
