import {z} from 'zod';
import {ChainId, SUPPORTED_CHAIN_IDS} from '../../../common/domain/types';

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

const nodeNameSchema = z
  .string()
  .regex(
    /^[@]?[a-zA-Z0-9_.-]+\/[@]?[a-zA-Z0-9_.-]+$/,
    "Expected format is '@owner/@repo', '@owner/repo', 'owner/@repo', 'owner/repo' or 'root'",
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

const addressSchema = z
  .string()
  .length(42) // Enforce length with 0x prefix.
  .regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid address');

export const newEcosystemRequestSchema = z.object({
  graph: graphSchema,
  metadata: metadataSchema,
  ownerAddress: addressSchema,
  name: z.string().min(1).max(100),
  chainId: z.enum(Object.values(SUPPORTED_CHAIN_IDS) as [ChainId]),
});

export type NodeDto = z.infer<typeof nodeSchema>;
export type EdgeDto = z.infer<typeof edgeSchema>;
export type GraphDto = z.infer<typeof graphSchema>;
export type Address = z.infer<typeof addressSchema>;
export type NewEcosystemRequestDto = z.infer<typeof newEcosystemRequestSchema>;
