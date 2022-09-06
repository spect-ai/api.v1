import { guild } from '@guildxyz/sdk';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { User } from 'src/users/model/users.model';

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
    try {
      const res = await guild.getUserAccess(guildId || 0, user.ethAddress);
      console.log({ res });
      return res;
    } catch (e) {
      console.log({ e });
    }

    throw new InternalServerErrorException();
  }
}
