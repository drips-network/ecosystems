import {UUID} from 'crypto';
import {
  BadRequestError,
  NotFoundError,
} from '../../../../common/application/HttpError';
import {Ecosystem} from '../../../../common/domain/entities.ts/Ecosystem';
import {dataSource} from '../../../../common/infrastructure/datasource';
import {Node} from '../../../../common/domain/entities.ts/Node';
import {id, AbiCoder, getAddress} from 'ethers';
import unreachable from '../../../../common/application/unreachable';
import {OxString, ChainId} from '../../../../common/domain/types';
import getWallet from '../../../../common/infrastructure/contracts/getWallet';
import {logger} from '../../../../common/infrastructure/logger';

export async function getEcosystemById(ecosystemId: UUID) {
  const ecosystem = await dataSource.getRepository(Ecosystem).findOneBy({
    id: ecosystemId,
  });

  if (!ecosystem) {
    throw new NotFoundError(`Ecosystem with id '${ecosystemId}' not found.`);
  }

  return ecosystem;
}

export async function verifyCanDeployEcosystem(id: UUID) {
  const ecosystem = await getEcosystemById(id);

  if (ecosystem.state !== 'pending_deployment') {
    throw new BadRequestError(
      `Ecosystem '${id}' cannot be deployed while in '${ecosystem.state}' state.`,
    );
  }
}

export async function getEcosystemNodes(ecosystemId: UUID): Promise<Node[]> {
  const nodes = await dataSource
    .getRepository(Node)
    .createQueryBuilder('node')
    .where('node.ecosystemId = :id', {id: ecosystemId})
    .getMany();

  if (!nodes.length) {
    throw new NotFoundError(`Ecosystem with ID '${ecosystemId}' not found.`);
  }

  return nodes;
}

export async function setMainIdentityForEcosystem(
  txHash: OxString,
  ecosystemId: UUID,
  chainId: ChainId,
  ownerAddress: OxString,
) {
  const wallet = getWallet(chainId);
  const receipt =
    (await wallet.provider.getTransactionReceipt(txHash)) ||
    unreachable('Transaction receipt not found.');

  if (receipt && receipt.logs) {
    // Look for the `Transfer` event in the logs.
    // The event signature is: CreatedSplits(uint256 indexed accountId, bytes32 indexed splitsHash).
    const transferEvent = receipt.logs.find(log => {
      // Check if this log is for the `CreatedSplits` event
      const eventSignature = id('Transfer(address,address,uint256)');
      return log.topics[0] === eventSignature;
    });

    if (!transferEvent || transferEvent.topics.length < 4) {
      unreachable('Transfer event not found in the receipt logs.');
    }

    // The `accountId` is the fourth indexed parameter (topics[3]).
    const accountId = AbiCoder.defaultAbiCoder()
      .decode(['uint256'], transferEvent.topics[3])[0]
      .toString();

    // The owner address ('to') is the third indexed parameter (topics[2]).
    const expectedOwnerAddress = getAddress(
      '0x' + transferEvent.topics[2].slice(26),
    );

    if (expectedOwnerAddress !== ownerAddress) {
      unreachable(
        `Owner address mismatch. Expected: ${ownerAddress}, got: ${expectedOwnerAddress}`,
      );
    }

    await dataSource
      .getRepository(Ecosystem)
      .update({id: ecosystemId}, {accountId: accountId});

    logger.info(
      `Main identity set to '${accountId}' for ecosystem '${ecosystemId}'.`,
    );
  }
}
