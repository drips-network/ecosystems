export type UnwrappedEthersResult<T> = T extends [infer U]
  ? U
  : T extends readonly [infer U]
    ? U
    : T;

export function unwrapEthersResult<T>(
  result: T | T[],
): UnwrappedEthersResult<T> | UnwrappedEthersResult<T[]> {
  if (Array.isArray(result) && result.length === 1) {
    return result[0] as UnwrappedEthersResult<T>;
  }
  return result as UnwrappedEthersResult<T[]>;
}
