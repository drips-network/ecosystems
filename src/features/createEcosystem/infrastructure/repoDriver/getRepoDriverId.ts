import {Contract, hexlify, toUtf8Bytes} from 'ethers';
import {ChainId, SUPPORTED_CHAIN_IDS} from '../../../../domain/types';
import getProvider from './getProvider';

const REPO_DRIVER_ABI = [
  {
    inputs: [
      {
        internalType: 'enum Forge',
        name: 'forge',
        type: 'uint8',
      },
      {
        internalType: 'bytes',
        name: 'name',
        type: 'bytes',
      },
    ],
    name: 'calcAccountId',
    outputs: [
      {
        internalType: 'uint256',
        name: 'accountId',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

const REPO_DRIVER_ADDRESSES: Record<ChainId, string> = {
  '1': '0x770023d55D09A9C110694827F1a6B32D5c2b373E',
  '11155111': '0xa71bdf410D48d4AA9aE1517A69D7E1Ef0c179b2B',
  '314': '0xe75f56B26857cAe06b455Bfc9481593Ae0FB4257',
};

const contractInstances = new Map<ChainId, Contract>();

const getRepoDriverContract = (chainId: ChainId): Contract => {
  if (!SUPPORTED_CHAIN_IDS.includes(chainId as ChainId)) {
    throw new Error(`Unsupported chain ID: ${chainId}`);
  }

  const existingContract = contractInstances.get(chainId);
  if (existingContract) {
    return existingContract;
  }

  const provider = getProvider(chainId);
  const contract = new Contract(
    REPO_DRIVER_ADDRESSES[chainId],
    REPO_DRIVER_ABI,
    provider,
  );

  contractInstances.set(chainId, contract);

  return contract;
};

export const getRepoDriverId = async (
  chainId: ChainId,
  projectName: string,
) => {
  const contract = getRepoDriverContract(chainId);

  return (
    await contract.calcAccountId(0, hexlify(toUtf8Bytes(projectName)))
  ).toString();
};
