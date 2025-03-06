import type {
  AbiFunction,
  AbiParametersToPrimitiveTypes,
  ExtractAbiFunction,
  ExtractAbiFunctionNames,
} from 'abitype';
import {repoDriverAbi, RepoDriverAbi} from './repoDriverAbi';
import {unwrapEthersResult, UnwrappedEthersResult} from '../unwrapEthersResult';
import {Contract} from 'ethers';
import getWallet from '../getWallet';
import {ChainId} from '../../../domain/types';
import {contractsConfigByChainId} from '../contractsConfig';

export enum Forge {
  GitHub = 0,
}

export async function executeRepoDriverReadMethod<
  functionName extends ExtractAbiFunctionNames<RepoDriverAbi, 'pure' | 'view'>,
  abiFunction extends AbiFunction = ExtractAbiFunction<
    RepoDriverAbi,
    functionName
  >,
>(config: {
  functionName:
    | functionName
    | ExtractAbiFunctionNames<RepoDriverAbi, 'pure' | 'view'>;
  args: AbiParametersToPrimitiveTypes<abiFunction['inputs'], 'inputs'>;
  chainId: ChainId;
}): Promise<
  UnwrappedEthersResult<
    AbiParametersToPrimitiveTypes<abiFunction['outputs'], 'outputs'>
  >
> {
  const {functionName: func, args, chainId} = config;

  const wallet = getWallet(chainId);
  const contractAddress = contractsConfigByChainId[chainId].REPO_DRIVER;

  const repoDriver = new Contract(contractAddress, repoDriverAbi, wallet);

  return unwrapEthersResult(await repoDriver[func](...args));
}
