import {ProcessingKeys} from '../../../../common/infrastructure/redis/keys';
import {loadResults} from '../../../../common/infrastructure/redis/loadResults';
import {
  FailedProjectVerificationResult,
  ProjectVerificationResult,
  SuccessfulProjectVerificationResult,
} from './createRedisOptions';

export async function loadProjectVerificationResults(
  keys: ProcessingKeys,
  totalJobs: number,
) {
  const results = await loadResults<ProjectVerificationResult>({
    keys,
    totalItems: totalJobs,
    isSuccessful: result => Boolean(result.verificationResult?.success),
    parseResult: value => JSON.parse(value) as ProjectVerificationResult,
  });

  return {
    successful: results.successful as SuccessfulProjectVerificationResult[],
    failed: results.failed as FailedProjectVerificationResult[],
  };
}
