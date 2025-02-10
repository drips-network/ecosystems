import unreachable from '../../../../application/unreachable';
import {logger} from '../../../../infrastructure/logger';
import {
  FailedNodeVerificationResult,
  SuccessfulNodeVerificationResult,
} from '../github/verifyNode';
import redis from '../../../../infrastructure/redis';
import {ChainId} from '../../../../domain/types';
import {buildQueueId} from './keys';
import {UUID} from 'crypto';
import {ProcessingResult} from './saveProcessingResultToRedis';

export type SuccessfullyVerifiedProcessingResult = ProcessingResult & {
  verificationResult: SuccessfulNodeVerificationResult;
};

export type UnsuccessfullyVerifiedProcessingResult = ProcessingResult & {
  verificationResult: FailedNodeVerificationResult;
};

export type ProcessingResults = {
  successfullyVerifiedJobs: SuccessfullyVerifiedProcessingResult[];
  unsuccessfullyVerifiedJobs: UnsuccessfullyVerifiedProcessingResult[];
  hasUnsuccessfulJobs: boolean;
};

export const loadProcessingResultsFromRedis = async (
  ecosystemId: UUID,
  chainId: ChainId,
  totalJobs: number,
): Promise<ProcessingResults> => {
  logger.info(`Loading results from Redis for ecosystem '${ecosystemId}'...`);

  const qId = buildQueueId(ecosystemId, chainId);
  const keys = await redis.keys(`results-${qId}-job:*`);
  const results = await Promise.all(
    keys.map(async key => {
      const value = await redis.get(key);
      if (!value) {
        unreachable(`Value not found for key '${key}'.`);
      }
      try {
        return JSON.parse(value) as ProcessingResult;
      } catch (err) {
        logger.error(
          `Failed to parse Redis value for key '${key}'. This should never happen if entries are created as expected.`,
          err,
        );
        unreachable('Failed to parse Redis value.');
      }
    }),
  );

  const successfullyVerifiedJobs = results
    .filter(
      result =>
        result.verificationResult !== undefined &&
        'success' in result.verificationResult &&
        result.verificationResult.success === true,
    )
    .map(result => ({
      job: result.job,
      verificationResult: result.verificationResult,
    })) as SuccessfullyVerifiedProcessingResult[];

  const unsuccessfullyVerifiedJobs = results
    .filter(
      result =>
        result.verificationResult !== undefined &&
        'success' in result.verificationResult &&
        result.verificationResult.success === false,
    )
    .map(result => ({
      job: result.job,
      verificationResult: result.verificationResult,
    })) as UnsuccessfullyVerifiedProcessingResult[];

  if (
    successfullyVerifiedJobs.length + unsuccessfullyVerifiedJobs.length !==
    totalJobs
  ) {
    const qId = buildQueueId(ecosystemId, chainId);
    unreachable(`Unexpected number of processed jobs in queue '${qId}'.'`);
  }

  return {
    successfullyVerifiedJobs,
    unsuccessfullyVerifiedJobs,
    hasUnsuccessfulJobs: unsuccessfullyVerifiedJobs.length > 0,
  };
};
