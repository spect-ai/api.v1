import { Injectable, InternalServerErrorException } from '@nestjs/common';
import fetch from 'node-fetch';
import { Card } from 'src/card/model/card.model';
import { Circle } from 'src/circle/model/circle.model';
import { DiscordChannel } from 'src/circle/types';

// TODO
@Injectable()
export class DiscordService {
  async getDiscordRole(discordId: string, guildId: string): Promise<string[]> {
    console.log({ discordId, guildId });
    try {
      const res = await fetch(
        `process.env.DISCORD_URI/api/userRoles?userId=${discordId}&guildId=${guildId}`,
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

  async postNotificationOnNewCircle(
    circle: Circle,
    channels: DiscordChannel[],
    guildId: string,
    url: string,
  ) {
    const res = await fetch(
      `process.env.DISCORD_URI/api/postNotificationOnNewCircle?guildId=${guildId}`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
        body: JSON.stringify({
          circle,
          channels,
          url,
        }),
      },
    );
    if (res.ok) {
      const data = await res.json();
      return data;
    }
    return null;
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
        }),
      },
    );
    if (res.ok) {
      const data = await res.json();
      return data;
    }
    return null;
  }

  async createChannel(guildId: string, channelName: string, parentId?: string) {
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
        }),
      },
    );
    if (res.ok) {
      const data = await res.json();
      return data;
    }
    return null;
  }
}
