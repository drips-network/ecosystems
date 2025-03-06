import unreachable from '../../application/unreachable';
import redis from '../redis';
import {ProcessingKeys} from './keys';

export type RedisLoaderOptions<T> = {
  keys: ProcessingKeys;
  totalItems: number;
  isSuccessful: (result: T) => boolean;
  parseResult: (value: string) => T;
};

export type LoadedResults<T> = {
  successful: T[];
  failed: T[];
};

export async function loadResults<T>(
  options: RedisLoaderOptions<T>,
): Promise<LoadedResults<T>> {
  const {keys, totalItems, isSuccessful, parseResult} = options;

  const data = await redis.hgetall(keys.resultsKey);
  const results = Object.entries(data).map(([, value]) => parseResult(value));

  if (results.length !== totalItems) {
    unreachable(
      `Found ${results.length} results on Redis but expected ${totalItems} for queue '${keys.queueKey}'.`,
    );
  }

  return {
    successful: results.filter(isSuccessful) as T[],
    failed: results.filter(result => !isSuccessful(result)),
  };
}
