import type {
  AbiFunction,
  AbiParametersToPrimitiveTypes,
  ExtractAbiFunction,
  ExtractAbiFunctionNames,
} from 'abitype';
import {callerAbi, CallerAbi} from './callerAbi';
import {Contract, ContractTransaction, TransactionResponse} from 'ethers';
import getWallet from '../getWallet';
import {contractsConfigByChainId} from '../contractsConfig';
import {ChainId, OxString} from '../../../domain/types';

export type CallerCall = {
  target: OxString;
  data: OxString;
  value: bigint;
};

export async function executeCallerWriteTx<
  functionName extends ExtractAbiFunctionNames<
    CallerAbi,
    'nonpayable' | 'payable'
  >,
  abiFunction extends AbiFunction = ExtractAbiFunction<CallerAbi, functionName>,
>(config: {
  functionName:
    | functionName
    | ExtractAbiFunctionNames<CallerAbi, 'nonpayable' | 'payable'>;
  args: AbiParametersToPrimitiveTypes<abiFunction['inputs'], 'inputs'>;
  chainId: ChainId;
}): Promise<TransactionResponse> {
  const {functionName: func, args, chainId} = config;

  const wallet = getWallet(chainId);
  const contractAddress = contractsConfigByChainId[chainId].CALLER;

  const caller = new Contract(contractAddress, callerAbi, wallet);

  return caller[func](...args);
}

export async function populateCallerWriteTx<
  functionName extends ExtractAbiFunctionNames<
    CallerAbi,
    'nonpayable' | 'payable'
  >,
  abiFunction extends AbiFunction = ExtractAbiFunction<CallerAbi, functionName>,
>(config: {
  functionName:
    | functionName
    | ExtractAbiFunctionNames<CallerAbi, 'nonpayable' | 'payable'>;
  args: AbiParametersToPrimitiveTypes<abiFunction['inputs'], 'inputs'>;
  chainId: ChainId;
}): Promise<ContractTransaction> {
  const {functionName: func, args, chainId} = config;

  const wallet = getWallet(chainId);
  const contractAddress = contractsConfigByChainId[chainId].CALLER;

  const caller = new Contract(contractAddress, callerAbi, wallet);

  return caller[func].populateTransaction(...args);
}

export function convertToCallerCall(tx: ContractTransaction): CallerCall {
  return {
    target: tx.to as OxString,
    data: tx.data as OxString,
    value: tx.value ?? 0n,
  };
}
