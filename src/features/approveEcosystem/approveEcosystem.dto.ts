import {UUID} from 'crypto';
import {z} from 'zod';

export const ApproveEcosystemPayloadSchema = z.object({
  name: z.string().min(1).max(100),
  graph: z
    .array(
      z.object({
        project: z.string().min(1).max(200),
        distribution: z
          .array(
            z.object({
              to: z.string().min(1).max(200),
              weight: z.number().min(0).max(100),
            }),
          )
          .nonempty(),
      }),
    )
    .nonempty(),
});

export type ApproveEcosystemRequestDto = z.infer<
  typeof ApproveEcosystemPayloadSchema
>;

export type ApproveEcosystemResponseDto = ApproveEcosystemRequestDto & {
  id: UUID;
};
