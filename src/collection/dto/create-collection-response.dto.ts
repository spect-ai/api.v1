import { ApiProperty } from '@nestjs/swagger';
import { MappedItem } from 'src/common/interfaces';
import { GuildRole } from 'src/common/types/role.type';
import {
  Activity,
  DefaultViewType,
  OpportunityInfo,
  Property,
  Voting,
  Permissions,
} from '../types/types';

export class CreateCollectionResponseDto {
  /**
   * The name of the collection
   * @example "My Collection"
   */
  name: string;

  /**
   * The unique slug of the collection
   * @example "my-collection"
   */
  slug: string;

  /**
   * Is collection private?
   * @example true
   */
  privateResponses: boolean;

  /**
   * The description of the collection
   * @example "This collection is created to track the progress of the project"
   */
  description: string;

  /**
   * Properties in the collection
   * @example {"name": "Name", "type": "shortText", "isPartOfFormView": true}
   */
  @ApiProperty({
    type: () =>
      class {
        properties: MappedItem<Property>;
      },
    example: {
      name: 'Name',
      type: 'shortText',
      isPartOfFormView: true,
    },
  })
  properties: MappedItem<Property>;

  /**
   * Properties in the collection
   * @example ["name"]
   */
  propertyOrder: string[];

  /**
   * The creator of the collection
   * @example "5f7e9b9b9b9b9b9b9b9b9b9b"
   */
  creator: string;

  /**
   * Parent Ids of the collection
   * @example ["5f7e9b9b9b9b9b9b9b9b9b9b"]
   */
  parents: string[];

  /**
   * The data contained in the collection
   * @example {"name": "John Doe"}
   */
  @ApiProperty({
    type: () =>
      class {
        data: MappedItem<object>;
      },
    example: {
      name: 'John Doe',
    },
  })
  data: MappedItem<object>;

  /**
   * All the activities in all the data streams - { dataSlug : { activityId: ActivityObject  } }
   * @example {}
   */
  dataActivities: MappedItem<MappedItem<Activity>>;

  /**
   * All the activity orders in all the data streams
   * @example []
   */
  @ApiProperty({
    type: () =>
      class {
        dataActivityOrder: MappedItem<string[]>;
      },
  })
  dataActivityOrder: MappedItem<string[]>;

  /**
   * The owner of the data
   * @example "5f7e9b9b9b9b9b9b9b9b9b9b"
   */
  @ApiProperty({
    type: () =>
      class {
        dataOwner: MappedItem<string>;
      },
  })
  dataOwner: MappedItem<string>;

  /**
   * The data indexed by different fields
   * @example {}
   */
  indexes: MappedItem<string[]>;

  /**
   * The default view of the collection
   * @example "form"
   */
  defaultView: DefaultViewType;

  /**
   * The guild.xyz roles that a person needs to hold to fill up form
   * @example ["5f7e9b9b9b9b9b9b9b9b9b9b"]
   */
  formRoleGating: GuildRole[];

  /**
   * The mintkudos token id to distribute when a person fills the form
   * @example "5f7e9b9b9b9b9b9b9b9b9b9b"
   */
  mintkudosTokenId: number;

  /**
   * The addresses that have already claimed mintkudos for submitting form
   * @example ["0x1234567890", "0x1234567890"]
   */
  mintkudosClaimedBy: string[];

  /**
   * The message to show when the form is submitted
   * @example "Thanks for your response!"
   */
  messageOnSubmission: string;

  /**
   * Multiple responses by same user allowed?
   * @example true
   */
  multipleResponsesAllowed: boolean;

  /**
   * Updating responses allowed?
   * @example true
   */
  updatingResponseAllowed: boolean;

  /**
   * Send confirmation email upon submission?
   * @example true
   */
  sendConfirmationEmail: boolean;

  /**
   * Send email to circle members upon new response
   * @example true
   */
  circleRolesToNotifyUponNewResponse: string[];

  /**
   * Send email to circle members upon updated response
   * @example true
   */
  circleRolesToNotifyUponUpdatedResponse: string[];

  /**
   * The logo of the collection
   * @example "https://example.com/logo.png"
   */
  logo: string;

  /**
   * The cover image of the collection
   * @example "https://example.com/cover.png"
   */
  cover: string;

  /**
   * Sybil protection enabled?
   * @example true
   */
  sybilProtectionEnabled: boolean;

  sybilProtectionScores: { [id: string]: number };

  numOfKudos: number;

  /**
   * Credential curation
   * @example true
   */
  credentialCurationEnabled: boolean;

  isAnOpportunity: boolean;

  opportunityInfo: OpportunityInfo;

  permissions: Permissions;

  voting: Voting;
}
