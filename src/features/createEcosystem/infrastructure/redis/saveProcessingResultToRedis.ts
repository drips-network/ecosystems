import {Job} from 'bee-queue';
import redis from '../../../../common/infrastructure/redis';
import {
  buildProcessedResultsKey,
  buildProcessedJobsCountKey,
  buildLockKey,
} from '../redis/keys';
import {ProjectVerificationJobData} from '../queue/createQueue';
import {NodeVerificationResult} from '../github/verifyNode';

/**
 * Lua script to save the processing result to Redis:
 * - Save the job result in the hash.
 * - Increment the appropriate counter.
 * - Get the current success and failure counts.
 * - If (success + failure) is less than totalJobs, return {0, currentCount}.
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

export default async function saveProcessingResultToRedis(
  job: Job<ProjectVerificationJobData>,
  verificationResult: NodeVerificationResult,
): Promise<{isProcessingCompleted: boolean; progress: number}> {
  const {ecosystemId, chainId, node, edges, totalJobs} = job.data;

  const value = JSON.stringify({verificationResult, node, edges});

  const processedResultsKey = buildProcessedResultsKey(ecosystemId, chainId);
  const successCounterKey = buildProcessedJobsCountKey(
    ecosystemId,
    chainId,
    'success',
  );
  const failureCounterKey = buildProcessedJobsCountKey(
    ecosystemId,
    chainId,
    'failed',
  );
  const lockKey = buildLockKey(ecosystemId, chainId);
  const lockExpiry = 60; // 1 minute.
  const status = verificationResult.success ? 'success' : 'failure';

  const result = (await redis.eval(
    LUA_SCRIPT,
    4, // Number of keys.
    processedResultsKey, // KEYS[1]: Processed results hash.
    successCounterKey, // KEYS[2]: Success counter key.
    failureCounterKey, // KEYS[3]: Failure counter key.
    lockKey, // KEYS[4]: Lock key.
    job.id, // ARGV[1]: Job ID.
    value, // ARGV[2]: Serialized processing result.
    status, // ARGV[3]: Job status ("success" or "failure").
    totalJobs.toString(), // ARGV[4]: Total expected jobs.
    lockExpiry.toString(), // ARGV[5]: Lock expiry time in seconds.
  )) as [boolean, number];

  return {
    isProcessingCompleted: Boolean(result[0]),
    progress: Number(result[1]),
  };
}
