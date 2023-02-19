export const surveyHubAbi = [
  {
    inputs: [
      {
        internalType: 'address',
        name: 'vrfAddress',
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
        internalType: 'uint256',
        name: 'surveyId',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'address',
        name: 'payee',
        type: 'address',
      },
    ],
    name: 'PaymentFulfilled',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'uint256',
        name: 'surveyId',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'address',
        name: 'responder',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'responseReceiptId',
        type: 'uint256',
      },
    ],
    name: 'ResponseAdded',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'bytes32',
        name: 'role',
        type: 'bytes32',
      },
      {
        indexed: true,
        internalType: 'bytes32',
        name: 'previousAdminRole',
        type: 'bytes32',
      },
      {
        indexed: true,
        internalType: 'bytes32',
        name: 'newAdminRole',
        type: 'bytes32',
      },
    ],
    name: 'RoleAdminChanged',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'bytes32',
        name: 'role',
        type: 'bytes32',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'account',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'sender',
        type: 'address',
      },
    ],
    name: 'RoleGranted',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'bytes32',
        name: 'role',
        type: 'bytes32',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'account',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'sender',
        type: 'address',
      },
    ],
    name: 'RoleRevoked',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'uint256',
        name: 'surveyId',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'address',
        name: 'owner',
        type: 'address',
      },
    ],
    name: 'SurveyCreated',
    type: 'event',
  },
  {
    inputs: [],
    name: 'DEFAULT_ADMIN_ROLE',
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
    name: 'RANDOM_NUMBER_GENERATOR_ROLE',
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
    name: 'RESPONSE_VALIDATOR_ROLE',
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
    inputs: [
      {
        internalType: 'uint256',
        name: 'surveyId',
        type: 'uint256',
      },
      {
        internalType: 'address',
        name: 'responder',
        type: 'address',
      },
    ],
    name: 'addResponse',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'surveyId',
        type: 'uint256',
      },
    ],
    name: 'conditionInfo',
    outputs: [
      {
        components: [
          {
            internalType: 'uint32',
            name: 'timestamp',
            type: 'uint32',
          },
          {
            internalType: 'uint32',
            name: 'minTotalSupply',
            type: 'uint32',
          },
        ],
        internalType: 'struct SurveyEscrow.Condition',
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint8',
        name: 'distributionType',
        type: 'uint8',
      },
      {
        internalType: 'uint256',
        name: 'amountPerResponse',
        type: 'uint256',
      },
      {
        internalType: 'uint32',
        name: 'timestamp',
        type: 'uint32',
      },
      {
        internalType: 'uint32',
        name: 'minTotalSupply',
        type: 'uint32',
      },
    ],
    name: 'createSurveyWithEther',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint8',
        name: 'distributionType',
        type: 'uint8',
      },
      {
        internalType: 'address',
        name: 'tokenAddress',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'amountPerResponse',
        type: 'uint256',
      },
      {
        internalType: 'uint32',
        name: 'timestamp',
        type: 'uint32',
      },
      {
        internalType: 'uint32',
        name: 'minTotalSupply',
        type: 'uint32',
      },
      {
        internalType: 'uint256',
        name: 'totalAmount',
        type: 'uint256',
      },
    ],
    name: 'createSurveyWithToken',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'surveyId',
        type: 'uint256',
      },
    ],
    name: 'distributionInfo',
    outputs: [
      {
        components: [
          {
            internalType: 'uint8',
            name: 'distributionType',
            type: 'uint8',
          },
          {
            internalType: 'address',
            name: 'tokenAddress',
            type: 'address',
          },
          {
            internalType: 'uint256',
            name: 'amountPerResponse',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'requestId',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'supplySnapshot',
            type: 'uint256',
          },
        ],
        internalType: 'struct SurveyEscrow.Distribution',
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'surveyId',
        type: 'uint256',
      },
    ],
    name: 'escrowBalance',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
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
        name: 'surveyId',
        type: 'uint256',
      },
    ],
    name: 'findLotteryWinner',
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
    inputs: [
      {
        internalType: 'uint256',
        name: 'surveyId',
        type: 'uint256',
      },
      {
        internalType: 'address',
        name: 'responder',
        type: 'address',
      },
    ],
    name: 'getPaidEther',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'surveyId',
        type: 'uint256',
      },
      {
        internalType: 'address',
        name: 'responder',
        type: 'address',
      },
    ],
    name: 'getPaidToken',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'bytes32',
        name: 'role',
        type: 'bytes32',
      },
    ],
    name: 'getRoleAdmin',
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
    inputs: [
      {
        internalType: 'bytes32',
        name: 'role',
        type: 'bytes32',
      },
      {
        internalType: 'address',
        name: 'account',
        type: 'address',
      },
    ],
    name: 'grantRole',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'surveyId',
        type: 'uint256',
      },
      {
        internalType: 'address',
        name: 'responder',
        type: 'address',
      },
    ],
    name: 'hasReceivedPayment',
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
        name: 'surveyId',
        type: 'uint256',
      },
      {
        internalType: 'address',
        name: 'responder',
        type: 'address',
      },
    ],
    name: 'hasResponded',
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
        internalType: 'bytes32',
        name: 'role',
        type: 'bytes32',
      },
      {
        internalType: 'address',
        name: 'account',
        type: 'address',
      },
    ],
    name: 'hasRole',
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
        name: 'surveyId',
        type: 'uint256',
      },
      {
        internalType: 'address',
        name: 'responder',
        type: 'address',
      },
    ],
    name: 'oneClickResponseAndEarnEther',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'surveyId',
        type: 'uint256',
      },
      {
        internalType: 'address',
        name: 'responder',
        type: 'address',
      },
    ],
    name: 'oneClickResponseAndEarnToken',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'surveyId',
        type: 'uint256',
      },
    ],
    name: 'paymentToken',
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
    inputs: [
      {
        internalType: 'bytes32',
        name: 'role',
        type: 'bytes32',
      },
      {
        internalType: 'address',
        name: 'account',
        type: 'address',
      },
    ],
    name: 'renounceRole',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'surveyId',
        type: 'uint256',
      },
    ],
    name: 'responseCount',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'bytes32',
        name: 'role',
        type: 'bytes32',
      },
      {
        internalType: 'address',
        name: 'account',
        type: 'address',
      },
    ],
    name: 'revokeRole',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'bytes4',
        name: 'interfaceId',
        type: 'bytes4',
      },
    ],
    name: 'supportsInterface',
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
    inputs: [],
    name: 'surveyCount',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
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
        name: '',
        type: 'uint256',
      },
    ],
    name: 'surveys',
    outputs: [
      {
        internalType: 'contract SurveyEscrow',
        name: 'escrow',
        type: 'address',
      },
      {
        internalType: 'contract Survey',
        name: 'survey',
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
        name: 'surveyId',
        type: 'uint256',
      },
    ],
    name: 'triggerRandomNumberGenerator',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
];
