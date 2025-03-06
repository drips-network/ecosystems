import {Job} from 'bee-queue';
import {ProjectVerificationJobData} from '../queue/enqueueProjectVerificationJobs';
import {createKeyBuilder} from '../../../../common/infrastructure/redis/keys';
import {NodeDto, EdgeDto} from '../../api/createEcosystemDtos';
import {
  FailedNodeVerificationResult,
  SuccessfulNodeVerificationResult,
} from '../github/verifyNode';

export type SuccessfulProjectVerificationResult = {
  node: NodeDto;
  edges: EdgeDto[];
  verificationResult: SuccessfulNodeVerificationResult;
};

export type FailedProjectVerificationResult = {
  success: false;
  error: string;
  verificationResult?: FailedNodeVerificationResult;
};

export type ProjectVerificationResult =
  | SuccessfulProjectVerificationResult
  | FailedProjectVerificationResult;

export default function createRedisOptions(
  ecosystemId: string,
  chainId: string,
) {
  return {
    keys: createKeyBuilder().buildAllKeys(
      `ecosystem:${ecosystemId}`,
      `chain:${chainId}`,
      'project-verification',
    ),
    getStatus: (result: ProjectVerificationResult) => {
      return Boolean(result.verificationResult?.success);
    },
    serializeValue: (result: ProjectVerificationResult) =>
      JSON.stringify({...result}),
    getTotalCount: (job: Job<ProjectVerificationJobData>) => job.data.totalJobs,
  };
}
