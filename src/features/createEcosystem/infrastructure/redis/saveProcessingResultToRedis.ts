import redis from '../../../../infrastructure/redis';
import {buildProcessedJobsCountKey, buildProcessedResultsKey} from './keys';
import {NodeVerificationResult} from '../github/verifyNode';
import {ProjectVerificationJobData} from '../queue/createEcosystemQueue';
import {Job} from 'bee-queue';

export default async function saveProcessingResultToRedis(
  job: Job<ProjectVerificationJobData>,
  verificationResult: NodeVerificationResult,
) {
  const {ecosystemId, chainId, node, edges} = job.data;

  const key = buildProcessedResultsKey(ecosystemId, chainId);
  const value = JSON.stringify({verificationResult, node, edges});

  await redis.hset(key, job.id, value);
  await redis.incr(
    buildProcessedJobsCountKey(
      ecosystemId,
      chainId,
      verificationResult.success ? 'success' : 'failed',
    ),
  );
}
