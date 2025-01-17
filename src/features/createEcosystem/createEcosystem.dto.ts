import {z} from 'zod';
import {ChainId, SUPPORTED_CHAIN_IDS} from '../../domain/types';

const metadataSchema = z.object({
  icon: z.string(),
  title: z.string(),
  text: z.string().optional(),
  link: z.object({
    href: z.string(),
    label: z.string(),
  }),
});

// A string in the format 'owner/repo' or 'root'.
const nodeNameSchema = z
  .string()
  .regex(
    /^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/,
    "Expected format is 'owner/repo' or 'root'",
  )
  .or(z.literal('root'));

const nodeSchema = z.object({
  projectName: nodeNameSchema,
});

const edgeSchema = z.object({
  source: nodeNameSchema,
  target: nodeNameSchema,
  weight: z.number().positive(),
});

const graphSchema = z.object({
  nodes: z.array(nodeSchema),
  edges: z.array(edgeSchema),
});

export const newEcosystemRequestSchema = z.object({
  graph: graphSchema,
  metadata: metadataSchema,
  ownerAccountId: z.string(),
  name: z.string().min(1).max(100),
  chainId: z.enum(Object.values(SUPPORTED_CHAIN_IDS) as [ChainId]),
});

export type NodeDto = z.infer<typeof nodeSchema>;
export type EdgeDto = z.infer<typeof edgeSchema>;
export type GraphDto = z.infer<typeof graphSchema>;
export type NewEcosystemRequestDto = z.infer<typeof newEcosystemRequestSchema>;
