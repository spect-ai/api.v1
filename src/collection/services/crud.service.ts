import { Injectable } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { GetCircleByIdQuery } from 'src/circle/queries/impl';
import { GuildxyzService } from 'src/common/guildxyz.service';
import { CredentialsService } from 'src/credentials/credentials.service';
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
    private readonly requestProvider: RequestProvider,
    private readonly guildxyzService: GuildxyzService,
    private readonly credentialService: CredentialsService,
  ) {}

  async hasRoleToAccessForm(collection: Collection) {
    if (collection.formRoleGating && collection.formRoleGating.length > 0) {
      if (!this.requestProvider.user) return false;
      const circle = await this.queryBus.execute(
        new GetCircleByIdQuery(collection.parents[0]),
      );
      const guildxyzRoles = await this.guildxyzService.getGuildxyzRole(
        circle.guildxyzId,
        this.requestProvider.user,
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

  async hasPassedSybilProtection(collection: Collection): Promise<boolean> {
    if (!collection.sybilProtectionEnabled) return true;

    if (!this.requestProvider.user) return false;

    return await this.credentialService.hasPassedSybilCheck(
      this.requestProvider.user.ethAddress,
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
    const hasRole = await this.hasRoleToAccessForm(collection);
    const formHasCredentialsButUserIsntConnected =
      collection.mintkudosTokenId &&
      collection.mintkudosTokenId > 0 &&
      !this.requestProvider.user;

    collection.canFillForm = hasRole && !formHasCredentialsButUserIsntConnected;

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
  ): Promise<CollectionPublicResponseDto> {
    const collection = await this.queryBus.execute(
      new GetCollectionBySlugQuery(slug),
    );

    const hasRole = await this.hasRoleToAccessForm(collection);
    collection.hasPassedSybilCheck = await this.hasPassedSybilProtection(
      collection,
    );
    const formHasCredentialsButUserIsntConnected =
      collection.mintkudosTokenId &&
      collection.mintkudosTokenId > 0 &&
      !this.requestProvider.user;
    collection.canFillForm =
      hasRole &&
      !formHasCredentialsButUserIsntConnected &&
      collection.hasPassedSybilCheck;
    collection.previousResponses = [];
    if (collection.dataOwner)
      for (const [dataSlug, owner] of Object.entries(collection.dataOwner)) {
        if (owner === this.requestProvider.user?.id) {
          collection.previousResponses.push(collection.data[dataSlug]);
        }
      }
    collection.kudosClaimedByUser =
      collection.mintkudosTokenId &&
      collection.mintkudosClaimedBy &&
      collection.mintkudosClaimedBy.includes(this.requestProvider.user?.id);

    const res = this.removePrivateFields(collection);
    return res;
  }
}
