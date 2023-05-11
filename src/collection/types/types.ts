import { MappedItem } from 'src/common/interfaces';

export type Permissions = {
  manageSettings: string[];
  updateResponsesManually: string[];
  viewResponses: string[];
  addComments: string[];
};

export type TokenModel = {
  symbol: string;

  name: string;

  address: string;
};

export type NetworkModel = {
  name: string;

  chainId: string;

  tokens: TokenModel[];
};

export type PayWallOptions = {
  network: Map<string, NetworkModel>;
  value: number;
  receiver: string;
  paid?: boolean;
};

export type Milestone = {
  id: string;
  title: string;
  description: string;
  dueDate: Date;
  reward: {
    chain: {
      name: string;
      chainId: string;
    };
    token: {
      name: string;
      symbol: string;
      address: string;
    };
    value: number;
  };
};

export type UserType = 'assignee' | 'reviewer' | 'grantee' | 'applicant';

export type CardRelationOptions = {
  childRelation: string;
  parentRelation: string;
};

export type Property = {
  id: string;
  name: string;
  type: PropertyType;
  isPartOfFormView: boolean;
  immutable?: boolean;
  default?: any;
  options?: Option[];
  userType?: UserType; // user type only relevant when type is user or user[]
  onUpdateNotifyUserTypes?: UserType[];
  rewardOptions?: Map<string, NetworkModel>; // only relevant when type is reward
  required?: boolean;
  payWallOptions?: PayWallOptions;
  description?: string;
  viewConditions?: Condition[];
  advancedConditions?: ConditionGroup;
  cardRelationOptions?: CardRelationOptions;
  internal?: boolean;
  maxSelections?: number;
  allowCustom?: boolean;
  milestoneFields?: string[];
};

export type PropertyType =
  | 'shortText'
  | 'longText'
  | 'number'
  | 'user[]'
  | 'user'
  | 'reward'
  | 'date'
  | 'singleSelect'
  | 'multiSelect'
  | 'ethAddress'
  | 'email'
  | 'milestone'
  | 'singleURL'
  | 'multiURL'
  | 'payWall'
  | 'cardRelation'
  | 'cardStatus'
  | 'discord'
  | 'twitter'
  | 'github'
  | 'telegram'
  | 'readonly';

export type Option = {
  label: string;
  value: string;
  data?: any;
};

export type Condition = {
  id: string;
  type: string;
  service: string;
  data: any;
};

export type ConditionGroup = {
  id: string;
  operator: 'and' | 'or';
  conditions: { [id: string]: Condition };
  conditionGroups?: { [id: string]: ConditionGroup };
  order: string[];
};

export type ComparisonCondition = 'greaterThanOrEqualTo' | 'lessThanOrEqualTo';

export type PopulatedCollectionFields = {
  parents?: { [fieldName: string]: number };
};

export type DefaultViewType = 'form' | 'table' | 'kanban' | 'list' | 'gantt';

export type Ref = {
  id: string;
  refType: 'user' | 'circle' | 'collection';
};

export type Activity = {
  content: string;
  ref: MappedItem<Ref>;
  timestamp: Date;
  comment: boolean;
  owner?: string;
  imageRef: string;
};

export type OpportunityInfo = {
  type: string;
  experience: string;
  skills: string[];
  tags: string[];
};

export type VotingPeriod = {
  votingType: Option;
  active: boolean;
  message?: string;
  options?: Option[];
  votesArePublic?: boolean;
  votesAreWeightedByTokens?: boolean;
  endsOn?: Date;
  startedOn?: Date;
  snapshot?: SnapshotVoting;
  votes?: MappedItem<number>;
};

export type SnapshotVoting = {
  space?: string;
  proposalId?: string;
};

export type SnapshotSpace = {
  name: string;
  id: string;
  network: string;
  symbol: string;
};

export type Voting = {
  votingType: Option;
  enabled: boolean;
  message?: string;
  options?: Option[];
  votesArePublic?: boolean;
  votesAreWeightedByTokens?: boolean;
  periods?: MappedItem<VotingPeriod>;
  periodsOnCollection?: MappedItem<VotingPeriod>;
  snapshot?: { [key: string]: SnapshotVoting };
};

export type SurveyTokenDistributionInfo = {
  amountPerResponse?: string;
  distributionType?: 0 | 1;
  tokenAddress: string; // if type is 1, timestap after which lottery is distributed
  requestId: string;
  supplySnapshot: number;
};

export type SurveyTokenConditionInfo = {
  timestamp: number;
  minTotalSupply: number;
};
