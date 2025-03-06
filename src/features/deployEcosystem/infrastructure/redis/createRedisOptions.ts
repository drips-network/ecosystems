import {Job} from 'bee-queue';
import {createKeyBuilder} from '../../../../common/infrastructure/redis/keys';
import {UUID} from 'crypto';
import {SubListsBatchJobData} from '../queue/enqueueJobs';
import {SubListReceiver} from '../../application/types';
import {AccountId} from '../../../../common/domain/types';

export type SuccessfulSubListCreationResult = {
  success: true;
  batchSubListReceivers: SubListReceiver[];
  parentDripListId: AccountId;
};

export type FailedSubListCreationResult = {
  success: false;
  error: string;
};

export type SubListCreationResult =
  | SuccessfulSubListCreationResult
  | FailedSubListCreationResult;

export default function createRedisOptions(ecosystemId: UUID, chainId: string) {
  return {
    keys: createKeyBuilder().buildAllKeys(
      `ecosystem:${ecosystemId}`,
      `chain:${chainId}`,
      'tx-submit',
    ),
    getStatus: (result: {success: boolean}) => result.success,
    serializeValue: (result: SubListCreationResult) =>
      JSON.stringify({
        ...result,
      } as SubListCreationResult),
    getTotalCount: (job: Job<SubListsBatchJobData>) => job.data.totalTxs,
  };
}
