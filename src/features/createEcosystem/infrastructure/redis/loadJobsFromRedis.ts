import unreachable from '../../../../application/unreachable';
import {logger} from '../../../../infrastructure/logger';
import {Job} from 'bee-queue';
import {
  ProjectVerificationJobData,
  RateLimitInfo,
} from '../queue/createEcosystemQueue';
import {
  FailedVerificationResult,
  SuccessfulVerificationResult,
} from '../github/verifyNode';
import redis from '../../../../infrastructure/redis';
import {ChainId} from '../../../../domain/types';
import {queueId} from '../../application/queueId';
import {UUID} from 'crypto';

type CompletedJobsResult = {
  successfullyVerifiedJobs: Job<
    ProjectVerificationJobData & {
      verificationResult: SuccessfulVerificationResult & {
        rateLimit?: RateLimitInfo;
      };
    }
  >[];
  unsuccessfullyVerifiedJobs: Job<
    ProjectVerificationJobData & {
      verificationResult: FailedVerificationResult & {
        rateLimit?: RateLimitInfo;
      };
    }
  >[];
};

export const loadJobsFromRedis = async (
  ecosystemId: UUID,
  chainId: ChainId,
  jobsCount: number,
): Promise<CompletedJobsResult> => {
  logger.info(`Loading results from Redis for ecosystem '${ecosystemId}'...`);

  const qId = queueId(ecosystemId, chainId);
  const keys = await redis.keys(`results-${qId}-job:*`);
  const results = await Promise.all(
    keys.map(async key => {
      const value = await redis.get(key);
      if (!value) {
        unreachable(`Value not found for key '${key}'.`);
      }
      try {
        return JSON.parse(value) as Job<ProjectVerificationJobData>;
      } catch (err) {
        logger.error(
          `Failed to parse Redis value for key '${key}'. This should never happen if entries are created as expected.`,
          err,
        );
        unreachable('Failed to parse Redis value.');
      }
    }),
  );

  const successfullyVerifiedJobs = results.filter(
    job =>
      job.data.verificationResult !== undefined &&
      'success' in job.data.verificationResult &&
      job.data.verificationResult.success === true,
  ) as Array<
    Job<
      ProjectVerificationJobData & {
        verificationResult: SuccessfulVerificationResult & {
          rateLimit?: RateLimitInfo;
        };
      }
    >
  >;

  const unsuccessfullyVerifiedJobs = results.filter(
    job =>
      job.data.verificationResult !== undefined &&
      'success' in job.data.verificationResult &&
      job.data.verificationResult.success === false,
  ) as Array<
    Job<
      ProjectVerificationJobData & {
        verificationResult: FailedVerificationResult & {
          rateLimit?: RateLimitInfo;
        };
      }
    >
  >;

  return {
    successfullyVerifiedJobs,
    unsuccessfullyVerifiedJobs,
  };
};
