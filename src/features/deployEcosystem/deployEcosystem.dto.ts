import {z} from 'zod';

export const deployEcosystemRequestSchema = z.object({
  id: z.string().uuid(),
});

export type DeployEcosystemRequestDto = z.infer<
  typeof deployEcosystemRequestSchema
>;
