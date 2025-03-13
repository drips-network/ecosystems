import {Provider} from 'ethers';
import expectUntil from '../../../common/application/expect';
import getWallet from '../../../common/infrastructure/contracts/getWallet';
import {ChainId, OxString} from '../../../common/domain/types';
import {logger} from '../../../common/infrastructure/logger';

export default async function waitUntilTxIsConfirmed(
  txHash: OxString,
  chainId: ChainId,
) {
  const wallet = getWallet(chainId);

  await expectUntil(
    () => isTxConfirmed(txHash, wallet.provider),
    result => result === true,
    6 * 60 * 1000, // 6 minutes
    10000, // 10 seconds
  );
}

async function isTxConfirmed(
  txHash: string,
  provider: Provider,
): Promise<boolean> {
  logger.info(`Checking if transaction '${txHash}' is confirmed...`);

  const receipt = await provider.getTransactionReceipt(txHash);

  if (!receipt) {
    logger.info(`Transaction '${txHash}' not mined yet.`);
    return false;
  }

  const currentBlock = await provider.getBlockNumber();

  const confirmations = currentBlock - receipt.blockNumber;

  const success = confirmations >= 3;

  if (success) {
    logger.info(`Transaction '${txHash}' is confirmed.`);
  } else {
    logger.info(
      `Transaction '${txHash}' is not confirmed yet. Confirmations: ${confirmations}.`,
    );
  }

  return success;
}
