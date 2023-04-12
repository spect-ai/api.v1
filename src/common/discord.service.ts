import { Injectable, InternalServerErrorException } from '@nestjs/common';
import fetch from 'node-fetch';
import { Property } from 'src/collection/types/types';
import { LoggingService } from 'src/logging/logging.service';
import { EncryptionService } from './encryption.service';

// TODO
@Injectable()
export class DiscordService {
  constructor(
    private readonly encryptionService: EncryptionService,
    private readonly logger: LoggingService,
  ) {
    this.logger.setContext('DiscordService');
  }

  async isConnected(guildId: string): Promise<boolean> {
    try {
      return await (
        await fetch(
          `${process.env.DISCORD_URI}/api/guildExists?guildId=${guildId}`,
        )
      ).json();
    } catch (e) {
      this.logger.error(e);
      throw e;
    }
  }

  async getDiscordRole(discordId: string, guildId: string): Promise<string[]> {
    try {
      return await (
        await fetch(
          `${process.env.DISCORD_URI}/api/userRoles?userId=${discordId}&guildId=${guildId}`,
        )
      ).json().guildRoles;
    } catch (e) {
      this.logger.error(e);
      throw e;
    }
  }

  async giveRolesToUser(
    guildId: string,
    discordUserId: string,
    roleIds: string[],
  ) {
    try {
      return await (
        await fetch(
          `${process.env.DISCORD_URI}/api/giveRoles?guildId=${guildId}`,
          {
            headers: {
              'Content-Type': 'application/json',
            },
            method: 'POST',
            body: JSON.stringify({
              roleIds,
              userId: discordUserId,
              secret: this.encryptionService.encrypt(process.env.API_SECRET),
            }),
          },
        )
      ).json();
    } catch (e) {
      this.logger.error(e);
      throw e;
    }
  }

  async createChannel(
    guildId: string,
    channelName: string,
    parentId?: string,
    isPrivate?: boolean,
    rolesToAdd?: string[],
    usersToAdd?: string[],
  ) {
    try {
      return await (
        await fetch(
          `${process.env.DISCORD_URI}/api/createChannel?guildId=${guildId}`,
          {
            headers: {
              'Content-Type': 'application/json',
            },
            method: 'POST',
            body: JSON.stringify({
              channelName,
              parentId,
              isPrivate,
              rolesToAdd,
              usersToAdd,
              secret: this.encryptionService.encrypt(process.env.API_SECRET),
            }),
          },
        )
      ).json();
    } catch (e) {
      this.logger.error(e);
      throw e;
    }
  }

  async postCard(
    channelId: string,
    title: string,
    url: string,
    message: string,
    fields: any,
    threadId?: string,
  ) {
    try {
      return await (
        await fetch(`${process.env.DISCORD_URI}/api/postCard`, {
          headers: {
            'Content-Type': 'application/json',
          },
          method: 'POST',
          body: JSON.stringify({
            channelId,
            card: {
              url,
              title,
              fields,
              msg: message,
            },
            threadId,
            secret: this.encryptionService.encrypt(process.env.API_SECRET),
          }),
        })
      ).json();
    } catch (e) {
      this.logger.error(e);
      throw e;
    }
  }

  async postForm(channelId: string, title: string, description: string) {
    try {
      return await (
        await fetch(`${process.env.DISCORD_URI}/api/postForm`, {
          headers: {
            'Content-Type': 'application/json',
          },
          method: 'POST',
          body: JSON.stringify({
            channelId,
            title,
            description,
          }),
        })
      ).json();
    } catch (e) {
      this.logger.error(e);
      throw e;
    }
  }

  async postSocials(
    channelId: string,
    socials: Property,
    nextField: Property,
    discordUserId: string,
  ) {
    try {
      return await (
        await fetch(`${process.env.DISCORD_URI}/api/postSocials`, {
          headers: {
            'Content-Type': 'application/json',
          },
          method: 'POST',
          body: JSON.stringify({
            channelId,
            socials,
            nextField,
            discordUserId: discordUserId,
          }),
        })
      ).json();
    } catch (e) {
      this.logger.error(e);
      throw e;
    }
  }

  async postFormPayment(
    channelId: string,
    paymentProperty: Property,
    nextField: Property,
    discordUserId: string,
  ) {
    try {
      return await (
        await fetch(`${process.env.DISCORD_URI}/api/postFormPayment`, {
          headers: {
            'Content-Type': 'application/json',
          },
          method: 'POST',
          body: JSON.stringify({
            channelId,
            paymentProperty,
            nextField,
            discordUserId,
          }),
        })
      ).json();
    } catch (e) {
      this.logger.error(e);
      throw e;
    }
  }

  async createThread(
    guildId: string,
    threadName: string,
    channelId: string,
    isPrivate: boolean,
    usersToAdd: string[],
    rolesToAdd: string[],
    message: string,
    isForm?: boolean,
  ) {
    try {
      return await (
        await fetch(
          `${process.env.DISCORD_URI}/api/createDiscussionThread?guildId=${guildId}`,
          {
            headers: {
              'Content-Type': 'application/json',
            },
            method: 'POST',
            body: JSON.stringify({
              threadName,
              channelId,
              isPrivate,
              usersToAdd,
              rolesToAdd,
              message,
              isForm,
              secret: this.encryptionService.encrypt(process.env.API_SECRET),
            }),
          },
        )
      ).json().result;
    } catch (e) {
      this.logger.error(e);
      throw e;
    }
  }
}
