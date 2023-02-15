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
        name: 'owner',
        type: 'address',
      },
    ],
    name: 'SurveyCreated',
    type: 'event',
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
];
