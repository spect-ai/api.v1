import { prop } from '@typegoose/typegoose';
import { Schema } from 'mongoose';
import { BaseModel } from 'src/base/base.model';
import { useMongoosePlugin } from 'src/base/decorators/use-mongoose-plugins.decorator';
import { Circle } from 'src/circle/model/circle.model';
import { MappedItem } from 'src/common/interfaces';
import { GuildRole } from 'src/common/types/role.type';
import {
  Activity,
  DefaultViewType,
  Property,
  Voting,
  OpportunityInfo,
  Permissions,
  Condition,
  Option,
} from '../types/types';

@useMongoosePlugin()
export class Collection extends BaseModel {
  /**
   * The name of the collection
   */
  @prop({ required: true })
  name: string;
  /**
   * The unique slug of the collection
   */
  @prop({ required: true })
  slug: string;

  /**
   * The description of the collection
   */
  @prop()
  description: string;

  /**
   * Properties in the collection
   */
  @prop()
  properties: MappedItem<Property>;

  /**
   * Properties in the collection
   */
  @prop({ default: [] })
  propertyOrder: string[];

  /**
   * The description of the collection
   */
  @prop({ required: true })
  creator: string;

  /**
   * Form Specific roles
   **/
  @prop()
  permissions: Permissions;

  /**
   * Parent Ids of the collection
   */
  @prop({ ref: () => Circle, type: Schema.Types.String, default: [] })
  parents: string[];

  /**
   * The data contained in the collection
   */
  @prop({ default: {} })
  data: MappedItem<object>;

  /**
   * The data contained in the collection
   */
  @prop({ default: {} })
  archivedData: MappedItem<object>;

  /**
   * All the activities in all the data streams - { dataSlug : { activityId: ActivityObject  } }
   */
  @prop({ default: {} })
  dataActivities: MappedItem<MappedItem<Activity>>;

  /**
   * All the activity orders in all the data streams
   */
  @prop({ default: {} })
  dataActivityOrder: MappedItem<string[]>;

  /**
   * The owner of the data
   */
  @prop({ default: {} })
  dataOwner: MappedItem<string>;

  /**
   * The data indexed by different fields
   */
  @prop({ default: {} })
  indexes: MappedItem<string[]>;

  /**
   * The default view of the collection
   */
  @prop({ default: 'table' })
  defaultView: DefaultViewType;

  /**
   * Send email to circle members upon new response
   */
  @prop({ default: [] })
  circleRolesToNotifyUponNewResponse: string[];

  /**
   * Send email to circle members upon updated response
   */
  @prop({ default: [] })
  circleRolesToNotifyUponUpdatedResponse: string[];

  @prop({
    default: {
      enabled: false,
    },
  })
  voting: Voting;

  /**
   * collectiontypes: 0: forms, 1: project
   */
  @prop({ default: 0 })
  collectionType: number;

  /**
   * Send email to circle members upon updated response
   */
  @prop({ default: {} })
  formMetadata: FormMetadata;

  @prop({ default: {} })
  projectMetadata: ProjectMetadata;

  @prop({ default: false })
  archived?: boolean;

  @prop({ default: {} })
  discordThreadRef: {
    [key: string]: {
      threadId: string;
      channelId: string;
      guildId: string;
      private: boolean;
    };
  };

  @prop({ default: {} })
  collectionLevelDiscordThreadRef: {
    channelId: string;
    guildId: string;
    private: boolean;
    threadId?: string;
    messageId?: string;
  };
}

export interface FormMetadata {
  ceramicEnabled?: boolean;
  captchaEnabled?: boolean;
  /**
   * Is collection private?
   */
  privateResponses?: boolean;

  /**
   * The guild.xyz roles that a person needs to hold to fill up form
   */
  formRoleGating?: GuildRole[];

  /**
   * Responses are anonymous?
   */
  allowAnonymousResponses?: boolean;

  /**
   * Responses are anonymous?
   */
  walletConnectionRequired?: boolean;

  /**
   * The mintkudos token id to distribute when a person fills the form
   */
  mintkudosTokenId?: number;

  /**
   * The addresses that have already claimed mintkudos for submitting form
   */
  mintkudosClaimedBy?: string[];

  /**
   * The message to show when the form is submitted
   */
  messageOnSubmission?: string;

  /**
   * Multiple responses by same user allowed?
   */
  multipleResponsesAllowed?: boolean;

  /**
   * Updating responses allowed?
   */
  updatingResponseAllowed?: boolean;

  /**
   * Send confirmation email upon submission?
   */
  sendConfirmationEmail?: boolean;

  /**
   * The message to show when the form is submitted
   */
  logo?: string;

  /**
   * The message to show when the form is submitted
   */
  cover?: string;

  sybilProtectionEnabled?: boolean;

  sybilProtectionScores?: { [id: string]: number };

  numOfKudos?: number;

  credentialCurationEnabled?: boolean;

  isAnOpportunity?: boolean;

  opportunityInfo?: OpportunityInfo;

  active?: boolean;

  discordConnectionRequired?: boolean;

  paymentConfig?: PaymentConfig;

  surveyTokenId?: number;

  surveyVRFRequestId?: string;
  surveyChain?: Option;
  surveyToken?: Option;
  surveyTotalValue?: number;
  surveyLotteryWinner?: number;
  claimCodes?: string[];
  claimCode?: string;
  poapEventId?: string;
  poapEditCode?: string;
  transactionHashes?: {
    [userAddress: string]: {
      [transactionType: string]: string;
    };
  };
  minimumNumberOfAnswersThatNeedToMatchForPoap?: number;
  responseDataForPoap?: MappedItem<any>;
  minimumNumberOfAnswersThatNeedToMatchForMintkudos?: number;
  responseDataForMintkudos?: MappedItem<any>;
  version?: number;
  pages?: {
    [pageId: string]: {
      id: string;
      name: string;
      properties: string[];
      movable?: boolean;
    };
  };
  pageOrder?: string[];

  drafts?: {
    [userId: string]: {
      [key: string]: any;
    };
  };
  currentField?: {
    [userId: string]: string;
  };
  skippedFormFields?: {
    [userId: string]: {
      field: boolean;
    };
  };
  lookup?: {
    tokens: {
      tokenType: 'erc20' | 'erc721' | 'erc1155';
      contractAddress: string;
      metadata: {
        name: string;
        image: string;
      };
      tokenId?: number;
      chainId: number;
    }[];
    snapshot: number;
  };

  // for finding options, users using discord interaction custom ids
  idLookup?: {
    [id: string]: any;
  };
}

export interface PaymentConfig {
  networks: {
    [chainId: string]: {
      chainId: string;
      chainName: string;
      tokens: {
        [tokenAddress: string]: {
          address: string;
          symbol: string;
          tokenAmount?: string;
          dollarAmount?: string;
        };
      };
      receiverAddress: string;
    };
  };
  type: 'paywall' | 'donation';
  required: boolean;
}

export interface ProjectMetadata {
  views: {
    [id: string]: {
      id: string;
      name: string;
      type: 'grid' | 'kanban' | 'gantt' | 'list' | 'form';
      groupByColumn?: string;
      filters?: Condition[];
      sort?: {
        property: string;
        direction: 'asc' | 'desc';
      };
    };
  };
  viewOrder: string[];
  cardOrders: {
    [columnName: string]: string[][];
  };
  payments?: {
    rewardField: string;
    payeeField: string;
  };
  paymentStatus?: {
    [dataSlug: string]: 'pending' | 'pendingSignature' | 'completed';
  };
  paymentIds?: {
    [dataSlug: string]: string;
  };
}
