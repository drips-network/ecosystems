import type {
  AbiFunction,
  AbiParametersToPrimitiveTypes,
  ExtractAbiFunction,
  ExtractAbiFunctionNames,
} from 'abitype';
import {
  repoSubAccountDriverAbi,
  RepoSubAccountDriverAbi,
} from './repoSubAccountDriverAbi';
import {unwrapEthersResult, UnwrappedEthersResult} from '../unwrapEthersResult';
import {Contract} from 'ethers';
import getWallet from '../getWallet';
import {ChainId} from '../../../domain/types';
import {contractsConfigByChainId} from '../contractsConfig';

export enum Forge {
  GitHub = 0,
}

export async function executeRepoSubAccountDriverReadMethod<
  functionName extends ExtractAbiFunctionNames<
    RepoSubAccountDriverAbi,
    'pure' | 'view'
  >,
  abiFunction extends AbiFunction = ExtractAbiFunction<
    RepoSubAccountDriverAbi,
    functionName
  >,
>(config: {
  functionName:
    | functionName
    | ExtractAbiFunctionNames<RepoSubAccountDriverAbi, 'pure' | 'view'>;
  args: AbiParametersToPrimitiveTypes<abiFunction['inputs'], 'inputs'>;
  chainId: ChainId;
}): Promise<
  UnwrappedEthersResult<
    AbiParametersToPrimitiveTypes<abiFunction['outputs'], 'outputs'>
  >
> {
  const {functionName: func, args, chainId} = config;

  const wallet = getWallet(chainId);
  const contractAddress =
    contractsConfigByChainId[chainId].REPO_SUB_ACCOUNT_DRIVER;

  // TODO: Remove when contract address exists for all chains.
  if (!contractAddress) {
    throw new Error(
      `Contract address for REPO_SUB_ACCOUNT_DRIVER not found for chainId: ${chainId}`,
    );
  }

  const repoDriver = new Contract(
    contractAddress,
    repoSubAccountDriverAbi,
    wallet,
  );

  return unwrapEthersResult(await repoDriver[func](...args));
}
