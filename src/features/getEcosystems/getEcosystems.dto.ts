import {z} from 'zod';

const metadataSchema = z.object({
  icon: z.string(),
  title: z.string(),
  text: z.string().optional(),
  link: z.object({
    href: z.string(),
    label: z.string(),
  }),
});

const ecosystemSchema = z.object({
  id: z.string(),
  ownerAccountId: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  nodeCount: z.number(),
  metadata: metadataSchema,
});

const getEcosystemsResponseSchema = z.array(ecosystemSchema);

export type GetEcosystemsResponseDto = z.infer<
  typeof getEcosystemsResponseSchema
>;

export type MetadataDto = z.infer<typeof metadataSchema>;
