import { Injectable, InternalServerErrorException } from '@nestjs/common';
import fetch from 'node-fetch';
import { EncryptionService } from './encryption.service';

// TODO
@Injectable()
export class DiscordService {
  constructor(private readonly encryptionService: EncryptionService) {}

  async isConnected(guildId: string): Promise<boolean> {
    const res = await fetch(
      `${process.env.DISCORD_URI}/api/guildExists?guildId=${guildId}`,
    );
    if (res.ok) {
      const data = await res.json();
      return data;
    }
    return false;
  }

  async getDiscordRole(discordId: string, guildId: string): Promise<string[]> {
    console.log({ discordId, guildId });
    try {
      const res = await fetch(
        `${process.env.DISCORD_URI}/api/userRoles?userId=${discordId}&guildId=${guildId}`,
      );
      if (res.ok) {
        const json = await res.json();
        return json.guildRoles;
      }
    } catch (e) {
      console.log({ e });
    }

    throw new InternalServerErrorException();
  }

  async giveRolesToUser(
    guildId: string,
    discordUserId: string,
    roleIds: string[],
  ) {
    const res = await fetch(
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
    );
    if (res.ok) {
      const data = await res.json();
      return data;
    }
    return null;
  }

  async createChannel(
    guildId: string,
    channelName: string,
    parentId?: string,
    isPrivate?: boolean,
    rolesToAdd?: string[],
    usersToAdd?: string[],
  ) {
    const res = await fetch(
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
    );
    if (res.ok) {
      const data = await res.json();
      return data;
    }
    return null;
  }

  async postCard(
    channelId: string,
    title: string,
    url: string,
    message: string,
    fields: any,
    threadId?: string,
  ) {
    console.log('posting');
    const res = await fetch(`${process.env.DISCORD_URI}/api/postCard`, {
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
    });
    console.log({ resss: res });
    if (res.ok) {
      const data = await res.json();
      console.log({ data });
      return data;
    }
    return null;
  }

  async createThread(
    guildId: string,
    threadName: string,
    channelId: string,
    isPrivate: boolean,
    usersToAdd: string[],
    rolesToAdd: string[],
    message: string,
  ) {
    const res = await fetch(
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
          secret: this.encryptionService.encrypt(process.env.API_SECRET),
        }),
      },
    );
    if (res.ok) {
      const data = await res.json();
      console.log({ data });
      return data.result;
    }
    return null;
  }
}
