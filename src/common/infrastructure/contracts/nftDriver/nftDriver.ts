import type {
  AbiFunction,
  AbiParametersToPrimitiveTypes,
  ExtractAbiFunction,
  ExtractAbiFunctionNames,
} from 'abitype';
import {Contract, ContractTransaction} from 'ethers';
import {NftDriverAbi, nftDriverAbi} from './nftDriverAbi';
import {contractsConfigByChainId} from '../contractsConfig';
import getWallet from '../getWallet';
import {ChainId} from '../../../domain/types';
import {unwrapEthersResult, UnwrappedEthersResult} from '../unwrapEthersResult';

export async function executeNftDriverReadMethod<
  functionName extends ExtractAbiFunctionNames<NftDriverAbi, 'pure' | 'view'>,
  abiFunction extends AbiFunction = ExtractAbiFunction<
    NftDriverAbi,
    functionName
  >,
>(config: {
  functionName:
    | functionName
    | ExtractAbiFunctionNames<NftDriverAbi, 'pure' | 'view'>;
  args: AbiParametersToPrimitiveTypes<abiFunction['inputs'], 'inputs'>;
  chainId: ChainId;
}): Promise<
  UnwrappedEthersResult<
    AbiParametersToPrimitiveTypes<abiFunction['outputs'], 'outputs'>
  >
> {
  const {functionName: func, args, chainId} = config;

  const wallet = getWallet(chainId);
  const contractAddress = contractsConfigByChainId[chainId].NFT_DRIVER;

  const nftDriver = new Contract(contractAddress, nftDriverAbi, wallet);

  return unwrapEthersResult(await nftDriver[func](...args));
}

export async function populateNftDriverWriteTx<
  functionName extends ExtractAbiFunctionNames<
    NftDriverAbi,
    'nonpayable' | 'payable'
  >,
  abiFunction extends AbiFunction = ExtractAbiFunction<
    NftDriverAbi,
    functionName
  >,
>(config: {
  functionName:
    | functionName
    | ExtractAbiFunctionNames<NftDriverAbi, 'nonpayable' | 'payable'>;
  args: AbiParametersToPrimitiveTypes<abiFunction['inputs'], 'inputs'>;
  chainId: ChainId;
}): Promise<ContractTransaction> {
  const {functionName: func, args, chainId} = config;

  const wallet = getWallet(chainId);
  const contractAddress = contractsConfigByChainId[chainId].NFT_DRIVER;

  const nftDriver = new Contract(contractAddress, nftDriverAbi, wallet);

  return nftDriver[func].populateTransaction(...args);
}
