import unreachable from '../../../../application/unreachable';
import {logger} from '../../../../infrastructure/logger';
import {
  FailedNodeVerificationResult,
  SuccessfulNodeVerificationResult,
} from '../github/verifyNode';
import redis from '../../../../infrastructure/redis';
import {ChainId} from '../../../../domain/types';
import {buildProcessedResultsKey, buildQueueId} from './keys';
import {UUID} from 'crypto';
import {EdgeDto, NodeDto} from '../../createEcosystem.dto';

export type SuccessfulProcessingResult = {
  node: NodeDto;
  edges: EdgeDto[];
  verificationResult: SuccessfulNodeVerificationResult;
};

export type FailedProcessingResult = {
  node: NodeDto;
  edges: EdgeDto[];
  verificationResult: FailedNodeVerificationResult;
};

export type ProcessingResult =
  | SuccessfulProcessingResult
  | FailedProcessingResult;

export default async function loadProcessingResultsFromRedis(
  ecosystemId: UUID,
  chainId: ChainId,
  totalJobs: number,
) {
  logger.info(`Loading results from Redis for ecosystem '${ecosystemId}'...`);

  const data = await redis.hgetall(
    buildProcessedResultsKey(ecosystemId, chainId),
  );
  const results = Object.entries(data).map(
    ([, value]) => JSON.parse(value) as ProcessingResult,
  );

  if (results.length !== totalJobs) {
    const qId = buildQueueId(ecosystemId, chainId);
    unreachable(
      `Found ${results.length} results on Redis but expected ${totalJobs} for queue '${qId}'.`,
    );
  }

  return {
    successful: results.filter(
      result => result.verificationResult.success,
    ) as SuccessfulProcessingResult[],
    failed: results.filter(
      result => !result.verificationResult.success,
    ) as FailedProcessingResult[],
  };
}
