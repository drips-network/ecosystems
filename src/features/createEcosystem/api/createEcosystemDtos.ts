import {z} from 'zod';
import {ChainId, SUPPORTED_CHAIN_IDS} from '../../../common/domain/types';
import {
  addressSchema,
  hexColorSchema,
} from '../../../common/application/schemas';

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

const emojiAvatarSchema = z.object({
  type: z.literal('emoji'),
  emoji: z.string(),
});

const deadlineSchema = z.coerce
  .date()
  .refine(date => !isNaN(date.getTime()), 'Invalid date')
  .refine(date => date > new Date(), 'Deadline must be in the future')
  .refine(
    date => date < new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    'Deadline cannot be more than 1 year in the future',
  );

export const newEcosystemRequestSchema = z
  .object({
    graph: graphSchema,
    metadata: metadataSchema,
    ownerAddress: addressSchema,
    name: z.string().min(1).max(100),
    description: z.string().min(1).max(1000).optional(),
    chainId: z.enum(Object.values(SUPPORTED_CHAIN_IDS) as [ChainId]),
    avatar: emojiAvatarSchema,
    color: hexColorSchema,
    deadline: deadlineSchema.optional(),
    refundAccountId: z.string().optional(),
  })
  .superRefine(
    (
      data: {deadline?: Date; refundAccountId?: string},
      ctx: z.RefinementCtx,
    ): void => {
      const hasDeadline: boolean = data.deadline !== undefined;
      const hasRefundAccountId: boolean = data.refundAccountId !== undefined;

      if (hasDeadline === hasRefundAccountId) {
        return;
      }

      const sharedMessage =
        'Both deadline and refundAccountId must be provided together, or neither.';

      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: sharedMessage,
        path: ['deadline'],
      });

      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: sharedMessage,
        path: ['refundAccountId'],
      });
    },
  );

export type NodeDto = z.infer<typeof nodeSchema>;
export type EdgeDto = z.infer<typeof edgeSchema>;
export type GraphDto = z.infer<typeof graphSchema>;
export type Address = z.infer<typeof addressSchema>;
export type NewEcosystemRequestDto = z.infer<typeof newEcosystemRequestSchema>;
