import { Injectable } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { GetCircleByIdQuery } from 'src/circle/queries/impl';
import { CommonTools } from 'src/common/common.service';
import { GuildxyzService } from 'src/common/guildxyz.service';
import { CredentialsService } from 'src/credentials/credentials.service';
import { User } from 'src/users/model/users.model';
import { Collection } from '../model/collection.model';

@Injectable()
export class AdvancedAccessService {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly guildxyzService: GuildxyzService,
    private readonly credentialService: CredentialsService,
    private readonly commonTools: CommonTools,
  ) {}

  async hasRoleToAccessForm(collection: Collection, caller?: User) {
    console.log({ caller: caller?.id });
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

  removePrivateFields(collection: Collection): any {
    delete collection.dataOwner;
    delete collection.data;
    delete collection.dataActivities;
    delete collection.dataActivityOrder;
    delete collection.mintkudosClaimedBy;

    return collection;
  }
}
