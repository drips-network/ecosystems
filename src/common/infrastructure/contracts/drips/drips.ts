import type {
  AbiFunction,
  AbiParametersToPrimitiveTypes,
  ExtractAbiFunction,
  ExtractAbiFunctionNames,
} from 'abitype';
import {Contract} from 'ethers';
import {unwrapEthersResult, UnwrappedEthersResult} from '../unwrapEthersResult';
import {dripsAbi, DripsAbi} from './dripsAbi';
import {ChainId} from '../../../domain/types';
import {contractsConfigByChainId} from '../contractsConfig';
import getWallet from '../getWallet';

export async function executeDripsReadMethod<
  functionName extends ExtractAbiFunctionNames<DripsAbi, 'pure' | 'view'>,
  abiFunction extends AbiFunction = ExtractAbiFunction<DripsAbi, functionName>,
>(config: {
  functionName:
    | functionName
    | ExtractAbiFunctionNames<DripsAbi, 'pure' | 'view'>;
  args: AbiParametersToPrimitiveTypes<abiFunction['inputs'], 'inputs'>;
  chainId: ChainId;
}): Promise<
  UnwrappedEthersResult<
    AbiParametersToPrimitiveTypes<abiFunction['outputs'], 'outputs'>
  >
> {
  const {functionName: func, args, chainId} = config;

  const wallet = getWallet(chainId);
  const contractAddress = contractsConfigByChainId[chainId].DRIPS;

  const drips = new Contract(contractAddress, dripsAbi, wallet);

  return unwrapEthersResult(await drips[func](...args));
}
