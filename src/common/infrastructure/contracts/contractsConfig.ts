import {ChainId, OxString} from '../../domain/types';

type ContractsConfig = {
  ADDRESS_DRIVER: OxString;
  DRIPS: OxString;
  CALLER: OxString;
  REPO_DRIVER: OxString;
  NFT_DRIVER: OxString;
  IMMUTABLE_SPLITS: OxString;
  NATIVE_TOKEN_UNWRAPPER: OxString | undefined;
};

export const contractsConfigByChainId: Record<ChainId, ContractsConfig> = {
  // Mainnet
  1: {
    ADDRESS_DRIVER: '0x1455d9bD6B98f95dd8FEB2b3D60ed825fcef0610',
    DRIPS: '0xd0Dd053392db676D57317CD4fe96Fc2cCf42D0b4',
    CALLER: '0x60F25ac5F289Dc7F640f948521d486C964A248e5',
    REPO_DRIVER: '0x770023d55D09A9C110694827F1a6B32D5c2b373E',
    NFT_DRIVER: '0xcf9c49B0962EDb01Cdaa5326299ba85D72405258',
    IMMUTABLE_SPLITS: '0x1212975c0642B07F696080ec1916998441c2b774',
    NATIVE_TOKEN_UNWRAPPER: undefined,
  },
  // Polygon Amoy
  80002: {
    ADDRESS_DRIVER: '0x004310a6d47893Dd6e443cbE471c24aDA1e6c619',
    DRIPS: '0xeebCd570e50fa31bcf6eF10f989429C87C3A6981',
    CALLER: '0x5C7c5AA20b15e13229771CB7De36Fe1F54238372',
    REPO_DRIVER: '0x54372850Db72915Fd9C5EC745683EB607b4a8642',
    NFT_DRIVER: '0xDafd9Ab96E62941808caa115D184D30A200FA777',
    IMMUTABLE_SPLITS: '0x65A48270e51A7aa901fD8fc42ab9cDddb50aff05',
    NATIVE_TOKEN_UNWRAPPER: undefined,
  },
  // Optimism Sepolia
  11155420: {
    ADDRESS_DRIVER: '0x70E1E1437AeFe8024B6780C94490662b45C3B567',
    DRIPS: '0x74A32a38D945b9527524900429b083547DeB9bF4',
    CALLER: '0x09e04Cb8168bd0E8773A79Cc2099f19C46776Fee',
    REPO_DRIVER: '0xa71bdf410D48d4AA9aE1517A69D7E1Ef0c179b2B',
    NFT_DRIVER: '0xdC773a04C0D6EFdb80E7dfF961B6a7B063a28B44',
    IMMUTABLE_SPLITS: '0xC3C1955bb50AdA4dC8a55aBC6d4d2a39242685c1',
    NATIVE_TOKEN_UNWRAPPER: undefined,
  },
  // Sepolia
  11155111: {
    ADDRESS_DRIVER: '0x70E1E1437AeFe8024B6780C94490662b45C3B567',
    DRIPS: '0x74A32a38D945b9527524900429b083547DeB9bF4',
    CALLER: '0x09e04Cb8168bd0E8773A79Cc2099f19C46776Fee',
    REPO_DRIVER: '0xa71bdf410D48d4AA9aE1517A69D7E1Ef0c179b2B',
    NFT_DRIVER: '0xdC773a04C0D6EFdb80E7dfF961B6a7B063a28B44',
    IMMUTABLE_SPLITS: '0xC3C1955bb50AdA4dC8a55aBC6d4d2a39242685c1',
    NATIVE_TOKEN_UNWRAPPER: undefined,
  },
  // Local testnet
  31337: {
    ADDRESS_DRIVER: '0x1707De7b41A3915F990A663d27AD3a952D50151d',
    DRIPS: '0x7CBbD3FdF9E5eb359E6D9B12848c5Faa81629944',
    CALLER: '0x2eac4218a453B1A52544Be315d2376B9A76614F1',
    REPO_DRIVER: '0x971e08fc533d2A5f228c7944E511611dA3B56B24',
    NFT_DRIVER: '0xf98e07d281Ff9b83612DBeF0A067d710716720eA',
    IMMUTABLE_SPLITS: '0xf98e07d281Ff9b83612DBeF0A067d710716720eA', // TODO: this is a wrong address!
    NATIVE_TOKEN_UNWRAPPER: undefined,
  },
  // Base Sepolia
  84532: {
    ADDRESS_DRIVER: '0x004310a6d47893Dd6e443cbE471c24aDA1e6c619',
    DRIPS: '0xeebCd570e50fa31bcf6eF10f989429C87C3A6981',
    CALLER: '0x5C7c5AA20b15e13229771CB7De36Fe1F54238372',
    REPO_DRIVER: '0x54372850Db72915Fd9C5EC745683EB607b4a8642',
    NFT_DRIVER: '0xDafd9Ab96E62941808caa115D184D30A200FA777',
    IMMUTABLE_SPLITS: '0x65A48270e51A7aa901fD8fc42ab9cDddb50aff05',
    NATIVE_TOKEN_UNWRAPPER: undefined,
  },
  // Filecoin
  314: {
    ADDRESS_DRIVER: '0x04693D13826a37dDdF973Be4275546Ad978cb9EE',
    DRIPS: '0xd320F59F109c618b19707ea5C5F068020eA333B3',
    CALLER: '0xd6Ab8e72dE3742d45AdF108fAa112Cd232718828',
    REPO_DRIVER: '0xe75f56B26857cAe06b455Bfc9481593Ae0FB4257',
    NFT_DRIVER: '0x2F23217A87cAf04ae586eed7a3d689f6C48498dB',
    IMMUTABLE_SPLITS: '0x96EC722e1338f08bbd469b80394eE118a0bc6753',
    NATIVE_TOKEN_UNWRAPPER: '0x64e0d60C70e9778C2E649FfBc90259C86a6Bf396',
  },
  // Metis
  1088: {
    ADDRESS_DRIVER: '0x04693D13826a37dDdF973Be4275546Ad978cb9EE',
    DRIPS: '0xd320F59F109c618b19707ea5C5F068020eA333B3',
    CALLER: '0xd6Ab8e72dE3742d45AdF108fAa112Cd232718828',
    REPO_DRIVER: '0xe75f56B26857cAe06b455Bfc9481593Ae0FB4257',
    NFT_DRIVER: '0x2F23217A87cAf04ae586eed7a3d689f6C48498dB',
    IMMUTABLE_SPLITS: '0x96EC722e1338f08bbd469b80394eE118a0bc6753',
    NATIVE_TOKEN_UNWRAPPER: undefined,
  },
};
