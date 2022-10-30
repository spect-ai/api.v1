import { Injectable } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { GetCircleByIdQuery } from 'src/circle/queries/impl';
import { GuildxyzService } from 'src/common/guildxyz.service';
import { CredentialsService } from 'src/credentials/credentials.service';
import { User } from 'src/users/model/users.model';
import { RequestProvider } from 'src/users/user.provider';
import {
  CollectionPublicResponseDto,
  CollectionResponseDto,
} from '../dto/collection-response.dto';
import { Collection } from '../model/collection.model';
import { GetCollectionBySlugQuery } from '../queries';
import { ActivityResolver } from './activity.service';

@Injectable()
export class CrudService {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly activityResolver: ActivityResolver,
    private readonly guildxyzService: GuildxyzService,
    private readonly credentialService: CredentialsService,
  ) {}

  async hasRoleToAccessForm(collection: Collection, caller?: User) {
    if (collection.formRoleGating && collection.formRoleGating.length > 0) {
      if (!caller) return false;
      const circle = await this.queryBus.execute(
        new GetCircleByIdQuery(collection.parents[0]),
      );
      const guildxyzRoles = await this.guildxyzService.getGuildxyzRole(
        circle.guildxyzId,
        caller,
      );
      const roleIds = new Set();
      for (const role of guildxyzRoles) {
        if (role.access) {
          roleIds.add(role.roleId);
        }
      }

      for (const role of collection.formRoleGating) {
        if (roleIds.has(role.id)) {
          return true;
        }
      }

      return false;
    }
    return true;
  }

  async hasPassedSybilProtection(
    collection: Collection,
    caller?: User,
  ): Promise<boolean> {
    if (!collection.sybilProtectionEnabled) return true;

    if (!caller) return false;

    return await this.credentialService.hasPassedSybilCheck(
      caller.ethAddress,
      collection.sybilProtectionScores,
    );
  }

  async getCollectionBySlug(slug: string): Promise<CollectionResponseDto> {
    const collection = await this.queryBus.execute(
      new GetCollectionBySlugQuery(slug),
    );
    collection.dataActivities = await this.activityResolver.resolveAll(
      collection.dataActivities,
    );
    return collection;
  }

  removePrivateFields(collection: Collection): any {
    delete collection.dataOwner;
    delete collection.data;
    delete collection.dataActivities;
    delete collection.dataActivityOrder;
    delete collection.mintkudosClaimedBy;

    return collection;
  }

  async getCollectionPublicViewBySlug(
    slug: string,
    caller?: User,
  ): Promise<CollectionPublicResponseDto> {
    const collection = await this.queryBus.execute(
      new GetCollectionBySlugQuery(slug),
    );

    const hasRole = await this.hasRoleToAccessForm(collection);
    collection.hasPassedSybilCheck = await this.hasPassedSybilProtection(
      collection,
    );
    const formHasCredentialsButUserIsntConnected =
      collection.mintkudosTokenId && collection.mintkudosTokenId > 0 && !caller;
    collection.canFillForm =
      hasRole &&
      !formHasCredentialsButUserIsntConnected &&
      collection.hasPassedSybilCheck;
    collection.previousResponses = [];
    if (collection.dataOwner)
      for (const [dataSlug, owner] of Object.entries(collection.dataOwner)) {
        if (owner === caller?.id) {
          collection.previousResponses.push(collection.data[dataSlug]);
        }
      }
    collection.kudosClaimedByUser =
      collection.mintkudosTokenId &&
      collection.mintkudosClaimedBy &&
      collection.mintkudosClaimedBy.includes(caller?.id);
    collection.canClaimKudos =
      collection.mintkudosTokenId &&
      !collection.kudosClaimedByUser &&
      collection.numOfKudos > collection.mintkudosClaimedBy?.length;
    const res = this.removePrivateFields(collection);
    return res;
  }
}
