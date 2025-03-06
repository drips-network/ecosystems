import {ProcessingKeys} from '../../../../common/infrastructure/redis/keys';
import {loadResults} from '../../../../common/infrastructure/redis/loadResults';
import {
  FailedSubListCreationResult,
  SubListCreationResult,
  SuccessfulSubListCreationResult,
} from './createRedisOptions';

export async function loadSubListCreationResults(
  keys: ProcessingKeys,
  totalJobs: number,
) {
  const results = await loadResults<SubListCreationResult>({
    keys,
    totalItems: totalJobs,
    isSuccessful: result => result.success,
    parseResult: value => JSON.parse(value) as SubListCreationResult,
  });

  return {
    successful: results.successful as SuccessfulSubListCreationResult[],
    failed: results.failed as FailedSubListCreationResult[],
  };
}
