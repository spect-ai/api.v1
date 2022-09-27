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
        `https://spect-discord-bot.herokuapp.com/api/userRoles?userId=${discordId}&guildId=${guildId}`,
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
      `https://spect-discord-bot.herokuapp.com/api/postNotificationOnNewCircle?guildId=${guildId}`,
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
}
