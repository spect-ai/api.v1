import { ApiHideProperty } from '@nestjs/swagger';
import { MappedItem } from 'src/common/interfaces';
import { GuildRole } from 'src/common/types/role.type';
import { User } from 'src/users/model/users.model';
import { Activity, DefaultViewType, Property } from '../types/types';

export class CollectionPublicResponseDto {
  name: string;
  slug: string;
  description: string;
  @ApiHideProperty()
  properties: MappedItem<Property>;

  propertyOrder: string[];
  defaultView: DefaultViewType;

  formRoleGating: number[];

  canFillForm: boolean;

  messageOnSubmission: string;

  mintkudosTokenId: number;

  kudosClaimedByUser: boolean;

  multipleResponsesAllowed: boolean;
  updatingResponseAllowed: boolean;
  @ApiHideProperty()
  previousResponses: MappedItem<object>;
  hasRole: boolean;
  hasPassedSybilCheck: boolean;
}

export class CollectionResponseDto {
  name: string;
  slug: string;
  description: string;
  @ApiHideProperty()
  properties: MappedItem<Property>;

  propertyOrder: string[];

  creator: string;

  parents: string[];

  @ApiHideProperty()
  data: MappedItem<object>;

  @ApiHideProperty()
  dataActivities: MappedItem<MappedItem<Activity>>;

  @ApiHideProperty()
  dataActivityOrder: MappedItem<string[]>;

  @ApiHideProperty()
  indexes: MappedItem<string[]>;

  defaultView: DefaultViewType;

  formRoleGating: GuildRole[];

  mintkudosTokenId: number;

  messageOnSubmission: string;
  circleRolesToNotifyUponNewResponse: string[];

  circleRolesToNotifyUponUpdatedResponse: string[];
  profiles: { [key: string]: User };
}
