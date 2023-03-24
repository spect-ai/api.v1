import { guild } from '@guildxyz/sdk';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { User } from 'src/users/model/users.model';
import fetch from 'node-fetch';
import { LoggingService } from 'src/logging/logging.service';

// TODO
@Injectable()
export class GuildxyzService {
  constructor(private readonly logger: LoggingService) {
    this.logger.setContext('GuildxyzService');
  }

  async getGuildxyzRole(
    guildId: number,
    user: User,
  ): Promise<
    {
      access: boolean;
      roleId: number;
    }[]
  > {
    try {
      const res = await guild.getUserAccess(guildId || 0, user.ethAddress);
      return res;
    } catch (e) {
      this.logger.logError(
        `Failed to get guild roles for user ${user?.ethAddress} & guild with id ${guildId} with error ${e}`,
      );
    }

    throw new InternalServerErrorException();
  }

  async getGuild(guildId: number) {
    try {
      const res = await fetch(`https://api.guild.xyz/v1/guild/${guildId}`);
      if (res.ok) {
        const data = await res.json();
        return data;
      }
    } catch (e) {
      this.logger.logError(
        `Failed to get guild of id ${guildId} with error ${e}`,
      );
      throw new InternalServerErrorException();
    }
  }

  async getGuildMemberships(ethAddress: string) {
    try {
      const res = await fetch(
        `https://api.guild.xyz/v1/user/membership/${ethAddress}`,
      );
      if (res.ok) {
        const data = await res.json();
        return data;
      }
    } catch (e) {
      console.log({ e });
    }

    throw new InternalServerErrorException();
  }
}
