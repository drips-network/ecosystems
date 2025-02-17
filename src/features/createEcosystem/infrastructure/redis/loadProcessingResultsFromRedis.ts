import {logger} from '../../../../common/infrastructure/logger';
import {
  FailedNodeVerificationResult,
  SuccessfulNodeVerificationResult,
} from '../github/verifyNode';
import redis from '../../../../common/infrastructure/redis';
import {buildProcessedResultsKey, buildQueueId} from './keys';
import {UUID} from 'crypto';
import {EdgeDto, NodeDto} from '../../api/createEcosystemDtos';
import {ChainId} from '../../../../common/domain/types';
import unreachable from '../../../../common/application/unreachable';

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
