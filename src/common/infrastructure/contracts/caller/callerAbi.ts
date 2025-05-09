export const callerAbi = [
  {inputs: [], name: 'InvalidShortString', type: 'error'},
  {
    inputs: [{internalType: 'string', name: 'str', type: 'string'}],
    name: 'StringTooLong',
    type: 'error',
  },
  {
    anonymous: false,
    inputs: [
      {indexed: true, internalType: 'address', name: 'sender', type: 'address'},
      {
        indexed: true,
        internalType: 'address',
        name: 'authorized',
        type: 'address',
      },
    ],
    name: 'Authorized',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {indexed: true, internalType: 'address', name: 'sender', type: 'address'},
      {
        indexed: true,
        internalType: 'address',
        name: 'authorized',
        type: 'address',
      },
    ],
    name: 'CalledAs',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {indexed: true, internalType: 'address', name: 'sender', type: 'address'},
      {indexed: false, internalType: 'uint256', name: 'nonce', type: 'uint256'},
    ],
    name: 'CalledSigned',
    type: 'event',
  },
  {anonymous: false, inputs: [], name: 'EIP712DomainChanged', type: 'event'},
  {
    anonymous: false,
    inputs: [
      {indexed: true, internalType: 'address', name: 'sender', type: 'address'},
      {
        indexed: false,
        internalType: 'uint256',
        name: 'newNonce',
        type: 'uint256',
      },
    ],
    name: 'NonceSet',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {indexed: true, internalType: 'address', name: 'sender', type: 'address'},
      {
        indexed: true,
        internalType: 'address',
        name: 'unauthorized',
        type: 'address',
      },
    ],
    name: 'Unauthorized',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {indexed: true, internalType: 'address', name: 'sender', type: 'address'},
    ],
    name: 'UnauthorizedAll',
    type: 'event',
  },
  {
    inputs: [],
    name: 'MAX_NONCE_INCREASE',
    outputs: [{internalType: 'uint256', name: '', type: 'uint256'}],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{internalType: 'address', name: 'sender', type: 'address'}],
    name: 'allAuthorized',
    outputs: [
      {internalType: 'address[]', name: 'authorized', type: 'address[]'},
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{internalType: 'address', name: 'user', type: 'address'}],
    name: 'authorize',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {internalType: 'address', name: 'sender', type: 'address'},
      {internalType: 'address', name: 'target', type: 'address'},
      {internalType: 'bytes', name: 'data', type: 'bytes'},
    ],
    name: 'callAs',
    outputs: [{internalType: 'bytes', name: 'returnData', type: 'bytes'}],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      {
        components: [
          {internalType: 'address', name: 'target', type: 'address'},
          {internalType: 'bytes', name: 'data', type: 'bytes'},
          {internalType: 'uint256', name: 'value', type: 'uint256'},
        ],
        internalType: 'struct Call[]',
        name: 'calls',
        type: 'tuple[]',
      },
    ],
    name: 'callBatched',
    outputs: [{internalType: 'bytes[]', name: 'returnData', type: 'bytes[]'}],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      {internalType: 'address', name: 'sender', type: 'address'},
      {internalType: 'address', name: 'target', type: 'address'},
      {internalType: 'bytes', name: 'data', type: 'bytes'},
      {internalType: 'uint256', name: 'deadline', type: 'uint256'},
      {internalType: 'bytes32', name: 'r', type: 'bytes32'},
      {internalType: 'bytes32', name: 'sv', type: 'bytes32'},
    ],
    name: 'callSigned',
    outputs: [{internalType: 'bytes', name: 'returnData', type: 'bytes'}],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'eip712Domain',
    outputs: [
      {internalType: 'bytes1', name: 'fields', type: 'bytes1'},
      {internalType: 'string', name: 'name', type: 'string'},
      {internalType: 'string', name: 'version', type: 'string'},
      {internalType: 'uint256', name: 'chainId', type: 'uint256'},
      {internalType: 'address', name: 'verifyingContract', type: 'address'},
      {internalType: 'bytes32', name: 'salt', type: 'bytes32'},
      {internalType: 'uint256[]', name: 'extensions', type: 'uint256[]'},
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {internalType: 'address', name: 'sender', type: 'address'},
      {internalType: 'address', name: 'user', type: 'address'},
    ],
    name: 'isAuthorized',
    outputs: [{internalType: 'bool', name: 'authorized', type: 'bool'}],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{internalType: 'address', name: 'forwarder', type: 'address'}],
    name: 'isTrustedForwarder',
    outputs: [{internalType: 'bool', name: '', type: 'bool'}],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{internalType: 'address', name: 'sender', type: 'address'}],
    name: 'nonce',
    outputs: [{internalType: 'uint256', name: '', type: 'uint256'}],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{internalType: 'uint256', name: 'newNonce', type: 'uint256'}],
    name: 'setNonce',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{internalType: 'address', name: 'user', type: 'address'}],
    name: 'unauthorize',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'unauthorizeAll',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

export type CallerAbi = typeof callerAbi;
