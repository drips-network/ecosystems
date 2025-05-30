export const repoDriverAbi = [
  {
    inputs: [
      {
        internalType: 'contract Drips',
        name: 'drips_',
        type: 'address',
      },
      {
        internalType: 'address',
        name: 'forwarder',
        type: 'address',
      },
      {
        internalType: 'uint32',
        name: 'driverId_',
        type: 'uint32',
      },
      {
        internalType: 'contract IAutomate',
        name: 'gelatoAutomate_',
        type: 'address',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'address',
        name: 'previousAdmin',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'address',
        name: 'newAdmin',
        type: 'address',
      },
    ],
    name: 'AdminChanged',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'beacon',
        type: 'address',
      },
    ],
    name: 'BeaconUpgraded',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'user',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'userFundsUsed',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'commonFundsUsed',
        type: 'uint256',
      },
    ],
    name: 'GelatoFeePaid',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'contract GelatoTasksOwner',
        name: 'gelatoTasksOwner',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'bytes32',
        name: 'taskId',
        type: 'bytes32',
      },
      {
        indexed: false,
        internalType: 'string',
        name: 'ipfsCid',
        type: 'string',
      },
      {
        indexed: false,
        internalType: 'uint32',
        name: 'maxRequestsPerBlock',
        type: 'uint32',
      },
      {
        indexed: false,
        internalType: 'uint32',
        name: 'maxRequestsPer31Days',
        type: 'uint32',
      },
    ],
    name: 'GelatoTaskUpdated',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'currentAdmin',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'newAdmin',
        type: 'address',
      },
    ],
    name: 'NewAdminProposed',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'uint256',
        name: 'accountId',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'enum Forge',
        name: 'forge',
        type: 'uint8',
      },
      {
        indexed: false,
        internalType: 'bytes',
        name: 'name',
        type: 'bytes',
      },
      {
        indexed: false,
        internalType: 'address',
        name: 'payer',
        type: 'address',
      },
    ],
    name: 'OwnerUpdateRequested',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'uint256',
        name: 'accountId',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'address',
        name: 'owner',
        type: 'address',
      },
    ],
    name: 'OwnerUpdated',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'pauser',
        type: 'address',
      },
    ],
    name: 'Paused',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'pauser',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'admin',
        type: 'address',
      },
    ],
    name: 'PauserGranted',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'pauser',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'admin',
        type: 'address',
      },
    ],
    name: 'PauserRevoked',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'pauser',
        type: 'address',
      },
    ],
    name: 'Unpaused',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'implementation',
        type: 'address',
      },
    ],
    name: 'Upgraded',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'user',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
    ],
    name: 'UserFundsDeposited',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'user',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'address payable',
        name: 'receiver',
        type: 'address',
      },
    ],
    name: 'UserFundsWithdrawn',
    type: 'event',
  },
  {
    inputs: [],
    name: 'acceptAdmin',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'admin',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'allPausers',
    outputs: [
      {
        internalType: 'address[]',
        name: 'pausersList',
        type: 'address[]',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'enum Forge',
        name: 'forge',
        type: 'uint8',
      },
      {
        internalType: 'bytes',
        name: 'name',
        type: 'bytes',
      },
    ],
    name: 'calcAccountId',
    outputs: [
      {
        internalType: 'uint256',
        name: 'accountId',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'accountId',
        type: 'uint256',
      },
      {
        internalType: 'contract IERC20',
        name: 'erc20',
        type: 'address',
      },
      {
        internalType: 'address',
        name: 'transferTo',
        type: 'address',
      },
    ],
    name: 'collect',
    outputs: [
      {
        internalType: 'uint128',
        name: 'amt',
        type: 'uint128',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'commonFunds',
    outputs: [
      {
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'user',
        type: 'address',
      },
    ],
    name: 'depositUserFunds',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'drips',
    outputs: [
      {
        internalType: 'contract Drips',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'driverId',
    outputs: [
      {
        internalType: 'uint32',
        name: '',
        type: 'uint32',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'accountId',
        type: 'uint256',
      },
      {
        components: [
          {
            internalType: 'bytes32',
            name: 'key',
            type: 'bytes32',
          },
          {
            internalType: 'bytes',
            name: 'value',
            type: 'bytes',
          },
        ],
        internalType: 'struct AccountMetadata[]',
        name: 'accountMetadata',
        type: 'tuple[]',
      },
    ],
    name: 'emitAccountMetadata',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'gelatoAutomate',
    outputs: [
      {
        internalType: 'contract IAutomate',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'gelatoTasksOwner',
    outputs: [
      {
        internalType: 'contract GelatoTasksOwner',
        name: 'tasksOwner',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'accountId',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'receiver',
        type: 'uint256',
      },
      {
        internalType: 'contract IERC20',
        name: 'erc20',
        type: 'address',
      },
      {
        internalType: 'uint128',
        name: 'amt',
        type: 'uint128',
      },
    ],
    name: 'give',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'pauser',
        type: 'address',
      },
    ],
    name: 'grantPauser',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'implementation',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'isPaused',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'pauser',
        type: 'address',
      },
    ],
    name: 'isPauser',
    outputs: [
      {
        internalType: 'bool',
        name: 'isAddrPauser',
        type: 'bool',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'forwarder',
        type: 'address',
      },
    ],
    name: 'isTrustedForwarder',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'accountId',
        type: 'uint256',
      },
    ],
    name: 'ownerOf',
    outputs: [
      {
        internalType: 'address',
        name: 'owner',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'pause',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'newAdmin',
        type: 'address',
      },
    ],
    name: 'proposeNewAdmin',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'proposedAdmin',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'proxiableUUID',
    outputs: [
      {
        internalType: 'bytes32',
        name: '',
        type: 'bytes32',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'renounceAdmin',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'enum Forge',
        name: 'forge',
        type: 'uint8',
      },
      {
        internalType: 'bytes',
        name: 'name',
        type: 'bytes',
      },
    ],
    name: 'requestUpdateOwner',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'requestUpdateOwnerGasPenalty',
    outputs: [
      {
        internalType: 'uint256',
        name: 'gasPenalty',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'pauser',
        type: 'address',
      },
    ],
    name: 'revokePauser',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'accountId',
        type: 'uint256',
      },
      {
        components: [
          {
            internalType: 'uint256',
            name: 'accountId',
            type: 'uint256',
          },
          {
            internalType: 'uint32',
            name: 'weight',
            type: 'uint32',
          },
        ],
        internalType: 'struct SplitsReceiver[]',
        name: 'receivers',
        type: 'tuple[]',
      },
    ],
    name: 'setSplits',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'accountId',
        type: 'uint256',
      },
      {
        internalType: 'contract IERC20',
        name: 'erc20',
        type: 'address',
      },
      {
        components: [
          {
            internalType: 'uint256',
            name: 'accountId',
            type: 'uint256',
          },
          {
            internalType: 'StreamConfig',
            name: 'config',
            type: 'uint256',
          },
        ],
        internalType: 'struct StreamReceiver[]',
        name: 'currReceivers',
        type: 'tuple[]',
      },
      {
        internalType: 'int128',
        name: 'balanceDelta',
        type: 'int128',
      },
      {
        components: [
          {
            internalType: 'uint256',
            name: 'accountId',
            type: 'uint256',
          },
          {
            internalType: 'StreamConfig',
            name: 'config',
            type: 'uint256',
          },
        ],
        internalType: 'struct StreamReceiver[]',
        name: 'newReceivers',
        type: 'tuple[]',
      },
      {
        internalType: 'uint32',
        name: 'maxEndHint1',
        type: 'uint32',
      },
      {
        internalType: 'uint32',
        name: 'maxEndHint2',
        type: 'uint32',
      },
      {
        internalType: 'address',
        name: 'transferTo',
        type: 'address',
      },
    ],
    name: 'setStreams',
    outputs: [
      {
        internalType: 'int128',
        name: 'realBalanceDelta',
        type: 'int128',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'unpause',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'string',
        name: 'ipfsCid',
        type: 'string',
      },
      {
        internalType: 'uint32',
        name: 'maxRequestsPerBlock',
        type: 'uint32',
      },
      {
        internalType: 'uint32',
        name: 'maxRequestsPer31Days',
        type: 'uint32',
      },
    ],
    name: 'updateGelatoTask',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'accountId',
        type: 'uint256',
      },
      {
        internalType: 'address',
        name: 'owner',
        type: 'address',
      },
      {
        internalType: 'address',
        name: 'payer',
        type: 'address',
      },
    ],
    name: 'updateOwnerByGelato',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'newImplementation',
        type: 'address',
      },
    ],
    name: 'upgradeTo',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'newImplementation',
        type: 'address',
      },
      {
        internalType: 'bytes',
        name: 'data',
        type: 'bytes',
      },
    ],
    name: 'upgradeToAndCall',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'user',
        type: 'address',
      },
    ],
    name: 'userFunds',
    outputs: [
      {
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
      {
        internalType: 'address payable',
        name: 'receiver',
        type: 'address',
      },
    ],
    name: 'withdrawUserFunds',
    outputs: [
      {
        internalType: 'uint256',
        name: 'withdrawnAmount',
        type: 'uint256',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    stateMutability: 'payable',
    type: 'receive',
  },
] as const;

export type RepoDriverAbi = typeof repoDriverAbi;
