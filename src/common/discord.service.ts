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

  async verifyDiscordAndGetUser(code: string): Promise<{
    id: string;
    username: string;
    avatar: string;
    discriminator: string;
  }> {
    try {
      const oauthResult = await fetch('https://discord.com/api/oauth2/token', {
        method: 'POST',
        body: new URLSearchParams({
          client_id: process.env.DISCORD_CLIENT_ID as string,
          client_secret: process.env.DISCORD_CLIENT_SECRET as string,
          code: code as string,
          grant_type: 'authorization_code',
          redirect_uri: `${process.env.DISCORD_REDIRECT_URI}/linkDiscord`,
          scope: 'guilds',
        }),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      if (oauthResult.status !== 200)
        throw new HttpException(
          'Failed Discord verification',
          oauthResult.status,
        );

      const oauthData: any = await oauthResult.json();
      const userResult = await fetch('https://discord.com/api/users/@me', {
        headers: {
          authorization: `${oauthData.token_type} ${oauthData.access_token}`,
        },
      });

      if (userResult.status !== 200)
        throw new HttpException('Failed fetching user', userResult.status);

      const userData = await userResult.json();
      return userData;
    } catch (e) {
      this.logger.error(e);
      throw e;
    }
  }

  async hasDiscordRole(
    discordId: string,
    guildId: string,
    roleIds: string[],
  ): Promise<boolean> {
    try {
      const res = await fetch(
        `${process.env.DISCORD_URI}/api/guilds/${guildId}/hasAtleastOneRole?userId=${discordId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            secret: this.encryptionService.encrypt(process.env.API_SECRET),
          },
          body: JSON.stringify({
            roleIds,
          }),
        },
      );
      const data = await res.json();
      if (res.status !== 200) throw new HttpException(data.message, res.status);

      return data.hasAtLeastOneRole;
    } catch (e) {
      this.logger.error(e);
      throw e;
    }
  }

  async getDiscordRole(discordId: string, guildId: string): Promise<string[]> {
    try {
      return await (
        await fetch(
          `${process.env.DISCORD_URI}/api/user/${discordId}/roles?guildId=${guildId}`,
          {
            headers: {
              secret: this.encryptionService.encrypt(process.env.API_SECRET),
            },
          },
        )
      ).json();
    } catch (e) {
      this.logger.error(e);
      throw e;
    }
  }

  async giveRolesToUser(
    guildId: string,
    roleIds: string[],
    discordUserId?: string,
    discordUsername?: string,
    discordDiscriminator?: string,
  ) {
    try {
      let url;
      if (discordUserId)
        url = `${process.env.DISCORD_URI}/api/guilds/${guildId}/roles/give?userId=${discordUserId}`;
      else if (discordUsername && discordDiscriminator)
        url = `${process.env.DISCORD_URI}/api/guilds/${guildId}/roles/give?username=${discordUsername}&discriminator=${discordDiscriminator}`;
      const res = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          secret: this.encryptionService.encrypt(process.env.API_SECRET),
        },
        method: 'POST',
        body: JSON.stringify({
          roleIds,
        }),
      });

      const json = await res.json();
      if (res.status !== 200) {
        throw new HttpException(json.message, res.status);
      }
      return json;
    } catch (e) {
      this.logger.error(e);
      throw e;
    }
  }

  async createChannel(
    guildId: string,
    name: string,
    parentId?: string,
    isPrivate?: boolean,
    rolesToAdd?: string[],
    usersToAdd?: string[],
  ) {
    try {
      console.log({ rolesToAdd, usersToAdd });
      const res = await fetch(
        `${process.env.DISCORD_URI}/api/channels?guildId=${guildId}`,
        {
          headers: {
            'Content-Type': 'application/json',
            secret: this.encryptionService.encrypt(process.env.API_SECRET),
          },
          method: 'POST',
          body: JSON.stringify({
            name,
            type: 'textChannel',
            parentId,
            isPrivate,
            rolesToAdd: [],
            usersToAdd: [],
          }),
        },
      );

      const json = await res.json();
      console.log({ json: json.errors });
      if (res.status !== 200) {
        throw new HttpException(json.message, res.status);
      }
      return json;
    } catch (e) {
      this.logger.error(e);
      throw e;
    }
  }

  async postData(channelId: string, title: string, url: string, fields: any) {
    try {
      const res = await fetch(
        `${process.env.DISCORD_URI}/api/collections/data?channelId=${channelId}`,
        {
          headers: {
            'Content-Type': 'application/json',
            secret: this.encryptionService.encrypt(process.env.API_SECRET),
          },
          method: 'POST',
          body: JSON.stringify({
            url,
            title,
            fields,
          }),
        },
      );

      const json = await res.json();
      if (res.status !== 200) {
        throw new HttpException(json.message, res.status);
      }
      return json;
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
        throw new HttpException(json.message, res.status);
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
        throw new HttpException(json.message, res.status);
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
        throw new HttpException(json.message, res.status);
      }
      return json;
    } catch (e) {
      this.logger.error(e);
      throw e;
    }
  }

  async createThread(
    guildId: string,
    name: string,
    channelId: string,
    isPrivate: boolean,
    usersToAdd: string[],
    rolesToAdd: string[],
    message: string,
    url?: string,
  ) {
    try {
      console.log({ message });
      const res = await fetch(
        `${process.env.DISCORD_URI}/api/channels?guildId=${guildId}&parentId=${channelId}`,
        {
          headers: {
            'Content-Type': 'application/json',
            secret: this.encryptionService.encrypt(process.env.API_SECRET),
          },
          method: 'POST',
          body: JSON.stringify({
            name,
            type: 'thread',
            isPrivate,
            usersToAdd,
            rolesToAdd,
            firstMessage: message || 'card',
            url,
          }),
        },
      );

      const json = await res.json();
      console.log({ json: json });
      if (res.status !== 200) {
        throw new HttpException(json.message, res.status);
      }
      return json;
    } catch (e) {
      this.logger.error(e);
      throw e;
    }
  }
}
