import type {
  AbiFunction,
  AbiParametersToPrimitiveTypes,
  ExtractAbiFunction,
  ExtractAbiFunctionNames,
} from 'abitype';
import {Contract, ContractTransaction} from 'ethers';
import {ImmutableSplitsAbi, immutableSplitsAbi} from './immutableSplitsAbi';
import {contractsConfigByChainId} from '../contractsConfig';
import getWallet from '../getWallet';
import {ChainId} from '../../../domain/types';

export async function populateImmutableSplitsDriverWriteTx<
  functionName extends ExtractAbiFunctionNames<
    ImmutableSplitsAbi,
    'nonpayable' | 'payable'
  >,
  abiFunction extends AbiFunction = ExtractAbiFunction<
    ImmutableSplitsAbi,
    functionName
  >,
>(config: {
  functionName:
    | functionName
    | ExtractAbiFunctionNames<ImmutableSplitsAbi, 'nonpayable' | 'payable'>;
  args: AbiParametersToPrimitiveTypes<abiFunction['inputs'], 'inputs'>;
  chainId: ChainId;
}): Promise<ContractTransaction> {
  const {functionName: func, args, chainId} = config;

  const wallet = getWallet(chainId);
  const contractAddress = contractsConfigByChainId[chainId].IMMUTABLE_SPLITS;

  const immutableSplits = new Contract(
    contractAddress,
    immutableSplitsAbi,
    wallet,
  );

  return immutableSplits[func].populateTransaction(...args);
}
