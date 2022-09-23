import { Injectable, InternalServerErrorException } from '@nestjs/common';
import fetch from 'node-fetch';
import { Card } from 'src/card/model/card.model';

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

  async postCardUpdate(card: Card, channelId: string, guildId: string) {
    const res = await fetch(
      `http://localhost:3001/api/postTaskUpdate?guildId=${guildId}`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
        body: JSON.stringify({
          task: card,
          channels: [channelId],
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
