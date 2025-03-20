import z from 'zod';

export const addressSchema = z
  .string()
  .length(42) // Enforce length with 0x prefix.
  .regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid address');

export const hexColorSchema = z
  .string()
  .regex(/^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/, {
    message: 'Invalid hex color.',
  });
