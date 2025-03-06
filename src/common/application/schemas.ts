import z from 'zod';

export const addressSchema = z
  .string()
  .length(42) // Enforce length with 0x prefix.
  .regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid address');
