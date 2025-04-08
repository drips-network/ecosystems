import {AccountId, OxString} from '../../../../common/domain/types';
import {
  SubListReceiver,
  TransactionExecutionStrategy,
} from '../../application/types';
import waitUntilTxIsConfirmed from '../../application/waitUntilTxIsConfirmed';
import {executeCallerWriteTx} from '../../../../common/infrastructure/contracts/caller/caller';
import getWallet from '../../../../common/infrastructure/contracts/getWallet';
import unreachable from '../../../../common/application/unreachable';
import {populateSubListCreationTxsByReceiversHash} from '../blockchain/populateTransactions';
import {AbiCoder, id, TransactionReceipt} from 'ethers';
import {logger} from '../../../../common/infrastructure/logger';
import {UUID} from 'crypto';
import {SubListsBatchJobData} from './enqueueJobs';

type TransactionExecutionStrategyContext = {
  job: SubListsBatchJobData;
  ecosystemMainAccountId: AccountId;
};

export const createNonSponsoredTransactionStrategy =
  (): TransactionExecutionStrategy<
    TransactionExecutionStrategyContext,
    SubListReceiver[]
  > => {
    return {
      executeTx: async ({
        job: {subList, chainId, ecosystemId},
        ecosystemMainAccountId,
      }: TransactionExecutionStrategyContext) => {
        const subListCreationTxsByReceiversHash =
          await populateSubListCreationTxsByReceiversHash(
            subList,
            chainId,
            ecosystemMainAccountId,
          );
        const txs = [...subListCreationTxsByReceiversHash.values()].map(
          ({tx}) => tx,
        );

        const {hash} = await executeCallerWriteTx({
          functionName: 'callBatched',
          args: [txs],
          chainId,
        });
        logger.info(
          `Executing caller transaction '${hash}' to create ${txs.length} immutable splits for ecosystem '${ecosystemId}'...`,
        );
        await waitUntilTxIsConfirmed(hash as OxString, chainId);

        logger.info(
          `Caller transaction to create immutable splits for ecosystem '${ecosystemId}' confirmed.`,
        );

        const wallet = getWallet(chainId);
        const receipt =
          (await wallet.provider.getTransactionReceipt(hash)) ||
          unreachable('Transaction receipt not found.');

        return extractSubListReceivers(
          receipt,
          subListCreationTxsByReceiversHash,
          ecosystemId,
        );
      },
    };
  };

function extractSubListReceivers(
  receipt: TransactionReceipt,
  txsByReceivers: Awaited<
    ReturnType<typeof populateSubListCreationTxsByReceiversHash>
  >,
  ecosystemId: UUID,
) {
  const receivers: SubListReceiver[] = [];

  if (receipt && receipt.logs) {
    // Look for the `CreatedSplits` event in the logs.
    // The event signature is: CreatedSplits(uint256 indexed accountId, bytes32 indexed splitsHash).
    const createdSplitsEvents = receipt.logs.filter(log => {
      // Check if this log is for the `CreatedSplits` event
      const eventSignature = id('CreatedSplits(uint256,bytes32)');
      return log.topics[0] === eventSignature;
    });

    if (createdSplitsEvents.length > 0) {
      createdSplitsEvents.forEach(createdSplitsEvent => {
        if (createdSplitsEvent.topics.length >= 3) {
          // The `accountId` is the first indexed parameter (topics[1]).
          const accountId = AbiCoder.defaultAbiCoder()
            .decode(['uint256'], createdSplitsEvent.topics[1])[0]
            .toString();

          // The `receiversHash` is the second indexed parameter (topics[2]).
          const receiversHash = AbiCoder.defaultAbiCoder()
            .decode(['bytes32'], createdSplitsEvent.topics[2])[0]
            .toString();
          const weight =
            txsByReceivers.get(receiversHash)?.weight || unreachable();

          receivers.push({
            accountId,
            weight,
            type: 'subList',
          });
        } else {
          unreachable('Invalid number of topics in the `CreatedSplits` event.');
        }
      });
    } else {
      logger.warn(
        `No 'CreatedSplits' events found in the receipt logs of tx '${receipt.hash}' for ecosystem '${ecosystemId}'.`,
      );
    }
  }

  logger.info(
    `Created the following immutable splits for ecosystem '${ecosystemId}': ${receivers
      .map(r => `(accountId: ${r.accountId}, weight: ${r.weight})`)
      .join(', ')}`,
  );

  return receivers;
}
