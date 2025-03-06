import {Job} from 'bee-queue';
import redis from '../redis';
import {ProcessingKeys} from './keys';

type ProcessingOptions<TJob, TResult> = {
  keys: ProcessingKeys;
  getStatus: (result: TResult) => boolean;
  serializeValue: (result: TResult) => string;
  getTotalCount: (job: Job<TJob>) => number;
  lockExpirySeconds?: number;
};

/**
 * Lua script to save the processing result to Redis:
 * - Save the job result in the hash.
 * - Increment the appropriate counter.
 * - Get the current success and failure counts.
 * - If ("success" + "failure") is less than totalJobs, return {0, currentCount}.
 * - Otherwise, attempt to acquire the lock.
 * - If the lock is acquired, return {1, currentCount} else return {0, currentCount}.
 */
const LUA_SCRIPT = `
  redis.call('HSET', KEYS[1], ARGV[1], ARGV[2])
  if ARGV[3] == "success" then
    redis.call('INCR', KEYS[2])
  else
    redis.call('INCR', KEYS[3])
  end
  local succ = tonumber(redis.call('GET', KEYS[2]) or "0")
  local fail = tonumber(redis.call('GET', KEYS[3]) or "0")
  local currentCount = succ + fail
  if currentCount < tonumber(ARGV[4]) then
    return {0, currentCount}
  end
  local lockResult = redis.call('SET', KEYS[4], "locked", "EX", ARGV[5], "NX")
  if lockResult then
    return {1, currentCount}
  end
  return {0, currentCount}
`;

export async function saveProcessedJob<TJob, TResult>(
  job: Job<TJob>,
  result: TResult,
  options: ProcessingOptions<TJob, TResult>,
): Promise<{isProcessingCompleted: boolean; progress: number}> {
  const {
    keys,
    getStatus,
    serializeValue,
    getTotalCount,
    lockExpirySeconds = 60, // Default 1 minute
  } = options;

  const status = getStatus(result) ? 'success' : 'failure';
  const value = serializeValue(result);
  const totalCount = getTotalCount(job);

  const redisResult = (await redis.eval(
    LUA_SCRIPT,
    4, // Number of keys
    keys.resultsKey, // KEYS[1] - Hash storing job results
    keys.successCountKey, // KEYS[2] - Counter for successful jobs
    keys.failureCountKey, // KEYS[3] - Counter for failed jobs
    keys.lockKey, // KEYS[4] - Lock key to prevent concurrent processing
    job.id, // ARGV[1] - Hash field (job ID)
    value, // ARGV[2] - Hash value (serialized job result)
    status, // ARGV[3] - Status ("success" or "failure")
    totalCount.toString(), // ARGV[4] - Total number of jobs to process
    lockExpirySeconds.toString(), // ARGV[5] - Lock expiry time in seconds
  )) as [boolean, number];

  return {
    isProcessingCompleted: Boolean(redisResult[0]),
    progress: Number(redisResult[1]),
  };
}
