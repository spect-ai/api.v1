import { guild } from '@guildxyz/sdk';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { User } from 'src/users/model/users.model';
import fetch from 'node-fetch';

// TODO
@Injectable()
export class GuildxyzService {
  async getGuildxyzRole(
    guildId: number,
    user: User,
  ): Promise<
    {
      access: boolean;
      roleId: number;
    }[]
  > {
    console.log({ guildId });
    console.log(user.ethAddress);
    try {
      const res = await guild.getUserAccess(guildId || 0, user.ethAddress);
      console.log({ res });
      return res;
    } catch (e) {
      console.log({ e });
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
      console.log({ e });
    }

    throw new InternalServerErrorException();
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
