import {
  HttpException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
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

  async postForm(channelId: string, name: string, description: string) {
    try {
      const res = await fetch(`${process.env.DISCORD_URI}/api/forms`, {
        headers: {
          'Content-Type': 'application/json',
          secret: this.encryptionService.encrypt(process.env.API_SECRET),
        },
        method: 'POST',
        body: JSON.stringify({
          channelId,
          name,
          description,
        }),
      });
      const json = await res.json();
      if (res.status !== 200) {
        throw new HttpException(
          {
            message: json.message || json.errors || 'Internal Server Error',
          },
          res.status || InternalServerErrorException,
        );
      }
      return json;
    } catch (e) {
      console.log({ e });
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
      console.log({ channelId, socials, nextField, discordUserId });
      const res = await fetch(`${process.env.DISCORD_URI}/api/forms/socials`, {
        headers: {
          'Content-Type': 'application/json',
          secret: this.encryptionService.encrypt(process.env.API_SECRET),
        },
        method: 'POST',
        body: JSON.stringify({
          channelId,
          currField: socials,
          nextField,
          discordUserId,
        }),
      });

      console.log({ res });

      const json = await res.json();
      if (res.status !== 200) {
        throw new HttpException(
          {
            message: json.message || json.errors || 'Internal Server Error',
          },
          res.status || InternalServerErrorException,
        );
      }
      return json;
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
      const res = await fetch(`${process.env.DISCORD_URI}/api/forms/payment`, {
        headers: {
          'Content-Type': 'application/json',
          secret: this.encryptionService.encrypt(process.env.API_SECRET),
        },
        method: 'POST',
        body: JSON.stringify({
          channelId,
          currField: paymentProperty,
          nextField,
          discordUserId,
        }),
      });

      const json = await res.json();
      if (res.status !== 200) {
        throw new HttpException(
          {
            message: json.message || json.errors || 'Internal Server Error',
          },
          res.status || InternalServerErrorException,
        );
      }
      return json;
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
