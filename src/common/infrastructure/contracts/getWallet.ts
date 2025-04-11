import {FetchRequest, Wallet} from 'ethers';
import FailoverJsonRpcProvider, {
  FailoverJsonRpcProviderConfig,
} from '../FailoverJsonRpcProvider';
import {ChainId, SUPPORTED_CHAIN_IDS} from '../../domain/types';
import {config} from '../../../config/configLoader';

function createAuthFetchRequest(rpcUrl: string, token: string): FetchRequest {
  const request = new FetchRequest(rpcUrl);
  request.method = 'POST';
  request.setHeader('Content-Type', 'application/json');
  request.setHeader('Authorization', `Bearer ${token}`);
  return request;
}

const providers: Partial<Record<ChainId, FailoverJsonRpcProvider>> = {};
Object.values(SUPPORTED_CHAIN_IDS).forEach(chain => {
  const rpc = config.rpc[chain];
  if (!rpc) {
    return;
  }

  const {url, accessToken, fallbackUrl, fallbackAccessToken} = rpc;
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

  providers[chain] = new FailoverJsonRpcProvider(
    rpcEndpoints,
    undefined,
    config.disableRpcCache ? {cacheTimeout: 0} : undefined,
    {
      logger: console,
    },
  );
});

export type WalletWithProvider = Wallet & {
  provider: FailoverJsonRpcProviderConfig;
};
const wallets: Partial<Record<ChainId, WalletWithProvider>> = {};

export default function getWallet(chainId: ChainId): WalletWithProvider {
  if (wallets[chainId]) {
    return wallets[chainId] as WalletWithProvider;
  }

  try {
    const provider = providers[chainId];
    if (!provider) {
      throw new Error(`Missing provider for chain ${chainId}`);
    }

    const wallet: WalletWithProvider = new Wallet(
      config.walletPrivateKey,
      provider,
    ) as WalletWithProvider;

    wallets[chainId] = wallet;
    return wallet;
  } catch (error) {
    wallets[chainId] = undefined;

    throw new Error(
      `Wallet initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}
