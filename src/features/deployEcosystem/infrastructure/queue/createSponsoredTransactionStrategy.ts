import {TransactionExecutionStrategy} from '../../application/types';
import {SubListsBatchJobData} from './enqueueJobs';

export const createSponsoredTransactionStrategy =
  (): TransactionExecutionStrategy<SubListsBatchJobData, void> => {
    return {
      executeTx: async () => {
        throw new Error('Transaction sponsorship is not implemented yet.');
      },
    };
  };
