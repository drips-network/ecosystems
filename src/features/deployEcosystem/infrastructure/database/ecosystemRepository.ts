import {UUID} from 'crypto';
import {
  BadRequestError,
  NotFoundError,
} from '../../../../common/application/HttpError';
import {Ecosystem} from '../../../../common/domain/entities.ts/Ecosystem';
import {dataSource} from '../../../../common/infrastructure/datasource';
import {Node} from '../../../../common/domain/entities.ts/Node';
import {id, AbiCoder, getAddress, ZeroAddress} from 'ethers';
import unreachable from '../../../../common/application/unreachable';
import {OxString, ChainId, AccountId} from '../../../../common/domain/types';
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
  preCalculatedDripListId: AccountId,
  ownerAddress: OxString,
) {
  const wallet = getWallet(chainId);
  const receipt =
    (await wallet.provider.getTransactionReceipt(txHash)) ||
    unreachable('Transaction receipt not found.');

  if (receipt && receipt.logs) {
    // Get all `Transfer` events.
    // The event signature is: Transfer(address,address,uint256).
    const transferEvents = receipt.logs.filter(log => {
      const eventSignature = id('Transfer(address,address,uint256)');
      return log.topics[0] === eventSignature;
    });

    if (transferEvents.length !== 2) {
      unreachable("Expected two 'Transfer' events in the receipt logs.");
    }

    // Identify the mint event by checking for a zero address in the `from` parameter.
    const mintEvent = transferEvents.find(log => {
      // The `from` address is the second indexed parameter (topics[1]).
      const fromAddress = getAddress('0x' + log.topics[1].slice(26));
      return fromAddress === ZeroAddress;
    });

    if (!mintEvent) {
      unreachable(
        'Mint event (with zero address as sender) not found in the receipt logs.',
      );
    }

    // Identify the transfer event as the one that is not the mint event.
    const transferOwnershipEvent = transferEvents.find(
      log => log !== mintEvent,
    );

    if (!transferOwnershipEvent) {
      unreachable('Transfer event not found after the mint event.');
    }

    // Validate the mint event: The NFT should be minted to the deployer.
    const mintedOwner = getAddress('0x' + mintEvent.topics[2].slice(26));
    const deployerAddress = wallet.address as OxString;
    if (mintedOwner !== deployerAddress) {
      unreachable(
        `Mint event owner mismatch. Expected deployer: ${deployerAddress}, got: ${mintedOwner}.`,
      );
    }

    // Validate the transfer event: It should transfer the NFT to the expected owner.
    const transferredOwner = getAddress(
      '0x' + transferOwnershipEvent.topics[2].slice(26),
    );
    if (transferredOwner !== ownerAddress) {
      unreachable(
        `Transfer event owner mismatch. Expected: ${ownerAddress}, got: ${transferredOwner}.`,
      );
    }

    // Validate the accountId from the transfer event.
    if (transferOwnershipEvent.topics.length < 4) {
      unreachable('Transfer event missing accountId in topics.');
    }
    const accountId = AbiCoder.defaultAbiCoder()
      .decode(['uint256'], transferOwnershipEvent.topics[3])[0]
      .toString();
    if (accountId !== preCalculatedDripListId) {
      unreachable(
        `Drip list ID mismatch. Expected: ${preCalculatedDripListId}, got: ${accountId}.`,
      );
    }

    // Update the ecosystem with the accountId.
    await dataSource
      .getRepository(Ecosystem)
      .update({id: ecosystemId}, {accountId: accountId});
    logger.info(
      `Main identity set to '${accountId}' for ecosystem '${ecosystemId}'.`,
    );
  }
}
