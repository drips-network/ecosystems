export const SUPPORTED_CHAIN_IDS = [
  '1',
  '80002',
  '11155420',
  '11155111',
  '31337',
  '84532',
  '314',
  '1088',
] as const;
export type ChainId = (typeof SUPPORTED_CHAIN_IDS)[number];

export type AccountId = string;
export type ProjectName = `${string}/${string}` | 'root';
export type OxString = `0x${string}`;
export type IpfsHash = string;

export type SplitsReceiver = {
  accountId: bigint;
  weight: number;
};
