import {FetchRequest} from 'ethers';
import FailoverJsonRpcProvider from './FailoverJsonRpcProvider';
import {ChainId} from '../../../../domain/types';
import unreachable from '../../../../application/unreachable';
import {config} from '../../../../infrastructure/config/configLoader';

const {rpc: rpcConfig} = config;

const providers: {[chainId: string]: FailoverJsonRpcProvider} = {};

function createAuthFetchRequest(rpcUrl: string, token: string): FetchRequest {
  const fetchRequest = new FetchRequest(rpcUrl);
  fetchRequest.method = 'POST';
  fetchRequest.setHeader('Content-Type', 'application/json');
  fetchRequest.setHeader('Authorization', `Bearer ${token}`);
  return fetchRequest;
}

function initProvider(chainId: ChainId): FailoverJsonRpcProvider {
  const config = rpcConfig[chainId];

  if (!config) {
    unreachable(`RPC configuration not found for chain ID ${chainId}.`);
  }

  const {url, accessToken, fallbackUrl, fallbackAccessToken} = config;

  if (
    !url.startsWith('http') ||
    (fallbackUrl && !fallbackUrl.startsWith('http'))
  ) {
    throw new Error('Unsupported RPC URL protocol.');
  }

  const primaryEndpoint = accessToken
    ? createAuthFetchRequest(url, accessToken)
    : url;

  const rpcEndpoints = [primaryEndpoint];

  if (fallbackUrl) {
    const fallbackEndpoint = fallbackAccessToken
      ? createAuthFetchRequest(fallbackUrl, fallbackAccessToken)
      : fallbackUrl;
    rpcEndpoints.push(fallbackEndpoint);
  }

  return new FailoverJsonRpcProvider(rpcEndpoints, undefined, undefined, {
    logger: console,
  });
}

export default function getProvider(chainId: ChainId): FailoverJsonRpcProvider {
  if (!providers[chainId]) {
    providers[chainId] = initProvider(chainId);
  }

  return providers[chainId];
}
