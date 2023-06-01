import { Injectable } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { GetCircleByIdQuery } from 'src/circle/queries/impl';
import { CommonTools } from 'src/common/common.service';
import { GuildxyzService } from 'src/common/guildxyz.service';
import { CredentialsService } from 'src/credentials/credentials.service';
import { GitcoinPassportService } from 'src/credentials/services/gitcoin-passport.service';
import { User } from 'src/users/model/users.model';
import { GetUserByFilterQuery } from 'src/users/queries/impl';
import { Collection } from '../model/collection.model';
import { GetCollectionByIdQuery } from '../queries';
import { DiscordService } from 'src/common/discord.service';
import { v4 as uuidv4 } from 'uuid';
import { UpdateCollectionCommand } from '../commands';
import { CollectionRepository } from '../collection.repository';

@Injectable()
export class AdvancedAccessService {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly guildxyzService: GuildxyzService,
    private readonly credentialService: GitcoinPassportService,
    private readonly discordService: DiscordService,
    private readonly collectionRepository: CollectionRepository,
  ) {}

  async requiresWalletConnect(collection: Collection): Promise<boolean> {
    if (
      collection.formMetadata.mintkudosTokenId ||
      collection.formMetadata.poapEventId ||
      collection.formMetadata.formRoleGating ||
      collection.formMetadata.sybilProtectionEnabled ||
      !collection.formMetadata.allowAnonymousResponses
    ) {
      return true;
    }
    return false;
  }

  async hasLinkedWalletToDiscord(
    collection: Collection,
    callerDiscordId: string,
  ): Promise<boolean> {
    if (collection.formMetadata.drafts?.[callerDiscordId]?.['connectedWallet'])
      return true;
    const user = await this.queryBus.execute(
      new GetUserByFilterQuery(
        {
          discordId: callerDiscordId,
        },
        '',
      ),
    );

    if (user?.ethAddress) {
      return true;
    }

    return false;
  }

  async hasRoleToAccessForm(collection: Collection, caller?: User) {
    console.log({ caller: caller?.id });
    if (
      collection.formMetadata.formRoleGating &&
      collection.formMetadata.formRoleGating.length > 0
    ) {
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

      for (const role of collection.formMetadata.formRoleGating) {
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
    if (!collection.formMetadata.sybilProtectionEnabled) return true;

    if (!caller) return false;

    return await this.credentialService.hasPassedSybilCheck(
      caller.ethAddress,
      collection.formMetadata.sybilProtectionScores,
    );
  }

  async generateAccessConfirmationTokenForDiscordRoleGatedForms(
    collectionId: string,
    code: string,
  ) {
    const userData = await this.discordService.verifyDiscordAndGetUser(code);
    const collection = (await this.queryBus.execute(
      new GetCollectionByIdQuery(collectionId, {}),
    )) as Collection;
    if (!collection)
      throw new Error('Collection not found while verifying access');
    const circle = await this.queryBus.execute(
      new GetCircleByIdQuery(collection.parents[0]),
    );
    if (!circle) throw new Error('Circle not found while verifying access');
    const discordGuildId = circle?.discordGuildId;
    if (!discordGuildId) throw new Error('Discord guild not set up for circle');
    const hasRole = await this.discordService.hasDiscordRole(
      userData.id,
      discordGuildId,
      collection.formMetadata.discordRoleGating?.map((role) => role.id) || [],
    );
    let verificationToken;
    if (hasRole) {
      verificationToken = uuidv4();
      await this.collectionRepository.updateById(collectionId, {
        formMetadata: {
          ...collection.formMetadata,
          verificationTokens: {
            ...(collection.formMetadata.verificationTokens || {}),
            [userData.id]: verificationToken,
          },
        },
      });
    }

    return {
      verificationToken,
      userData,
    };
  }

  async hasDiscordRoleToAccessForm(
    collection: Collection,
    callerDiscordId: string,
  ): Promise<boolean> {
    const circle = await this.queryBus.execute(
      new GetCircleByIdQuery(collection.parents[0]),
    );
    if (!circle) throw new Error('Circle not found while verifying access');
    const hasRole = await this.discordService.hasDiscordRole(
      callerDiscordId,
      circle?.discordGuildId,
      collection.formMetadata.discordRoleGating?.map((role) => role.id) || [],
    );
    return hasRole;
  }

  removePrivateFields(collection: Collection): any {
    delete collection.dataOwner;
    delete collection.data;
    delete collection.dataActivities;
    delete collection.dataActivityOrder;
    delete collection.formMetadata.mintkudosClaimedBy;
    collection.propertyOrder = collection.propertyOrder.filter(
      (property) => collection.properties[property],
    );
    delete collection.formMetadata?.poapEditCode;
    delete collection.formMetadata?.transactionHashes;
    delete collection.formMetadata?.responseDataForPoap;
    delete collection.formMetadata?.responseDataForMintkudos;
    delete collection.formMetadata?.idLookup;
    delete collection.formMetadata?.drafts;
    delete collection.formMetadata?.verificationTokens;
    delete collection.subscriptions;
    return collection;
  }
}
