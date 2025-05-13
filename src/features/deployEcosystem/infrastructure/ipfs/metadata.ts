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
import z from 'zod';

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
  ecosystemMainAccountId: AccountId,
  recipients: (ProjectReceiver | SubListReceiver)[],
): Promise<IpfsHash> {
  const {name, description} = await getEcosystemById(ecosystemId);

  const dripListMetadata = {
    driver: 'nft',
    describes: {
      driver: 'nft',
      accountId: ecosystemMainAccountId,
    },
    name,
    description,
    type: 'ecosystem',
    isVisible: true,
    recipients,
  } as LatestVersion<typeof nftDriverAccountMetadataParser>;

  nftDriverAccountMetadataParser.parseLatest(dripListMetadata);

  const ipfsHash = await pinJSON(dripListMetadata);

  logger.info(
    `Ecosystem Main Account '${ecosystemMainAccountId}' metadata pinned to IPFS with hash '${ipfsHash}'.`,
  );

  return ipfsHash;
}

export async function pinSubListMetadata(
  ecosystemMainAccountId: AccountId,
  receivers: Receiver[],
): Promise<IpfsHash> {
  const subListMetadata = {
    driver: 'immutable-splits',
    type: 'subList',
    isVisible: true,
    recipients: receivers,
    parent: {
      driver: 'nft',
      accountId: ecosystemMainAccountId,
      type: 'ecosystem',
    },
    root: {
      driver: 'nft',
      accountId: ecosystemMainAccountId,
      type: 'ecosystem',
    },
  } as LatestVersion<typeof immutableSplitsDriverMetadataParser>;

  immutableSplitsDriverMetadataParser.parseLatest(subListMetadata);

  const ipfsHash = await pinJSON(subListMetadata);

  logger.info(
    `Sub-list for parent Ecosystem Main Account '${ecosystemMainAccountId}' metadata pinned to IPFS with hash '${ipfsHash}'.`,
  );

  return ipfsHash;
}

async function pinJSON(data: unknown): Promise<IpfsHash> {
  if (config.fakePinataUrl) {
    const res = await fetch(`${config.fakePinataUrl}/pinning/pinJSONToIPFS`, {
      method: 'POST',
      body: JSON.stringify({pinataContent: data}),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const resBody = z.object({IpfsHash: z.string()}).parse(await res.json());
    return resBody.IpfsHash;
  }

  const res = await pinata.pinJSONToIPFS(data, {
    pinataOptions: {
      cidVersion: 0,
    },
  });

  return res.IpfsHash;
}
