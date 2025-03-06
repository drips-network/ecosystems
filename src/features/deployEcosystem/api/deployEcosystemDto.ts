import {z} from 'zod';
import {ChainId, SUPPORTED_CHAIN_IDS} from '../../../common/domain/types';
import {addressSchema} from '../../../common/application/schemas';

const paramsSchema = z.object({
  id: z.string().uuid(),
});

const bodySchema = z.object({
  chainId: z.enum(Object.values(SUPPORTED_CHAIN_IDS) as [ChainId]),
  ownerAddress: addressSchema,
});

export const deployEcosystemRequestSchema = z.object({
  params: paramsSchema,
  body: bodySchema,
});

export type DeployEcosystemRequestDto = z.infer<
  typeof deployEcosystemRequestSchema
>;
