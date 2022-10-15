import { Injectable } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { GetCircleByIdQuery } from 'src/circle/queries/impl';
import { GuildxyzService } from 'src/common/guildxyz.service';
import { RequestProvider } from 'src/users/user.provider';
import { CollectionResponseDto } from '../dto/collection-response.dto';
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
  ) {}

  async canFillForm(collection: Collection) {
    if (collection.formRoleGating && collection.formRoleGating.length > 0) {
      if (!this.requestProvider.user) return false;
      const circle = await this.queryBus.execute(
        new GetCircleByIdQuery(collection.parents[0]),
      );
      const guildxyzRoles = await this.guildxyzService.getGuildxyzRole(
        circle.guildxyzId,
        this.requestProvider.user,
      );
      console.log({ guildxyzRoles });
      const roleIds = new Set();
      for (const role of guildxyzRoles) {
        if (role.access) {
          roleIds.add(role.roleId);
        }
      }
      console.log({ roleIds });
      console.log({ roles: collection.formRoleGating });

      for (const role of collection.formRoleGating) {
        if (roleIds.has(role.id)) {
          return true;
        }
      }
      return false;
    }
    return true;
  }

  async getCollectionBySlug(slug: string): Promise<CollectionResponseDto> {
    const collection = await this.queryBus.execute(
      new GetCollectionBySlugQuery(slug),
    );
    collection.dataActivities = await this.activityResolver.resolveAll(
      collection.dataActivities,
    );
    console.log(this.requestProvider.user?.id);
    collection.canFillForm = await this.canFillForm(collection);
    return collection;
  }
}
