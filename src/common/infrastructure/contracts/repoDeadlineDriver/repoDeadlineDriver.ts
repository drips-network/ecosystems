import type {
  AbiFunction,
  AbiParametersToPrimitiveTypes,
  ExtractAbiFunction,
  ExtractAbiFunctionNames,
} from 'abitype';
import {
  repoDeadlineDriverAbi,
  RepoDeadlineDriverAbi,
} from './repoDeadlineDriverAbi';
import {unwrapEthersResult, UnwrappedEthersResult} from '../unwrapEthersResult';
import {Contract} from 'ethers';
import getWallet from '../getWallet';
import {ChainId} from '../../../domain/types';
import {contractsConfigByChainId} from '../contractsConfig';

export async function executeRepoDeadlineDriverReadMethod<
  functionName extends ExtractAbiFunctionNames<
    RepoDeadlineDriverAbi,
    'pure' | 'view'
  >,
  abiFunction extends AbiFunction = ExtractAbiFunction<
    RepoDeadlineDriverAbi,
    functionName
  >,
>(config: {
  functionName:
    | functionName
    | ExtractAbiFunctionNames<RepoDeadlineDriverAbi, 'pure' | 'view'>;
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
    contractsConfigByChainId[chainId].REPO_DEADLINE_DRIVER;

  if (!contractAddress) {
    throw new Error(
      `Contract address for REPO_DEADLINE_DRIVER not found for chainId: ${chainId}`,
    );
  }

  const repoDeadlineDriver = new Contract(
    contractAddress,
    repoDeadlineDriverAbi,
    wallet,
  );

  return unwrapEthersResult(await repoDeadlineDriver[func](...args));
}
