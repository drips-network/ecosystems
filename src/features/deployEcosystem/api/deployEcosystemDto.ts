import {z} from 'zod';

const paramsSchema = z.object({
  id: z.string().uuid(),
});

export const deployEcosystemRequestSchema = z.object({
  params: paramsSchema,
});

export type DeployEcosystemRequestDto = z.infer<
  typeof deployEcosystemRequestSchema
>;
