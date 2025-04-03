import {
  immutableSplitsDriverMetadataParser,
  nftDriverAccountMetadataParser,
} from '../../../../common/infrastructure/metadata/schemas';
import {AccountId, IpfsHash, OxString} from '../../../../common/domain/types';
import pinataSdk from '@pinata/sdk';
import {config} from '../../../../config/configLoader';
import {getEcosystemById} from '../database/ecosystemRepository';
import {UUID} from 'crypto';
import {logger} from '../../../../common/infrastructure/logger';
import {encodeBytes32String, hexlify, toUtf8Bytes} from 'ethers';
import {
  ProjectReceiver,
  Receiver,
  SubListReceiver,
} from '../../application/types';
import {LatestVersion} from '@efstajas/versioned-parser';

export const USER_METADATA_KEY = 'ipfs';

const {apiKey, secretApiKey} = config.pinata;
const pinata = new pinataSdk(apiKey, secretApiKey);

type MetadataKeyValue = {
  key: OxString;
  value: OxString;
};

export function keyValueToMetadata({
  key,
  value,
}: {
  key: string;
  value: string;
}): MetadataKeyValue {
  return {
    key: encodeBytes32String(key) as OxString,
    value: hexlify(toUtf8Bytes(value)) as OxString,
  };
}

export async function pinEcosystemMetadata(
  ecosystemId: UUID,
  dripListId: AccountId,
  recipients: (ProjectReceiver | SubListReceiver)[],
): Promise<IpfsHash> {
  const {name, description} = await getEcosystemById(ecosystemId);
  const dripListMetadata = {
    driver: 'nft',
    describes: {
      driver: 'nft',
      accountId: dripListId,
    },
    name,
    description,
    type: 'ecosystem',
    isVisible: true,
    recipients,
  } as LatestVersion<typeof nftDriverAccountMetadataParser>;

  // Ensure the data follows the correct schema at runtime.
  nftDriverAccountMetadataParser.parseLatest(dripListMetadata);

  const res = await pinata.pinJSONToIPFS(dripListMetadata, {
    pinataOptions: {
      cidVersion: 0,
    },
  });

  const ipfsHash = res.IpfsHash;

  logger.info(
    `Drip List '${dripListId}' metadata pinned to IPFS with hash '${ipfsHash}'.`,
  );

  return ipfsHash;
}

export async function pinSubListMetadata(
  parentDripListId: AccountId,
  receivers: Receiver[],
): Promise<IpfsHash> {
  const subListMetadata = {
    driver: 'immutable-splits',
    type: 'subList',
    isVisible: true,
    recipients: receivers,
    parent: {
      driver: 'nft',
      accountId: parentDripListId,
      type: 'ecosystem',
    },
    root: {
      driver: 'nft',
      accountId: parentDripListId, // With the current implementation, the root is always the same as the parent.
      type: 'ecosystem',
    },
  } as LatestVersion<typeof immutableSplitsDriverMetadataParser>;

  // Ensure the data follows the correct schema at runtime.
  immutableSplitsDriverMetadataParser.parseLatest(subListMetadata);

  const res = await pinata.pinJSONToIPFS(subListMetadata, {
    pinataOptions: {
      cidVersion: 0,
    },
  });

  const ipfsHash = res.IpfsHash;

  logger.info(
    `Sub-list for parent Drip List '${parentDripListId}' metadata pinned to IPFS with hash '${ipfsHash}'.`,
  );

  return ipfsHash;
}
