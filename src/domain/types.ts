export const SUPPORTED_CHAIN_IDS = ['1', '11155111', '314'] as const;
export type ChainId = (typeof SUPPORTED_CHAIN_IDS)[number];

export type AccountId = string;
export type ProjectName = `${string}/${string}`;
export type NodeName = ProjectName | 'root';
