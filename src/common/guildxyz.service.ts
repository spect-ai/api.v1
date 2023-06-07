import { guild } from '@guildxyz/sdk';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { User } from 'src/users/model/users.model';
import fetch from 'node-fetch';
import { LoggingService } from 'src/logging/logging.service';
import { CommonTools } from './common.service';

// TODO
@Injectable()
export class GuildxyzService {
  constructor(
    private readonly logger: LoggingService,
    private readonly commonTools: CommonTools,
  ) {
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
      throw new InternalServerErrorException(e);
    }
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
      throw new InternalServerErrorException(e);
    }
  }

  async getGuildMemberships(ethAddress: string): Promise<
    {
      guildId: number;
      roleIds: number[];
      joinedAt: string;
      isAdmin: boolean;
      isOwner: boolean;
    }[]
  > {
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
      throw new InternalServerErrorException(e);
    }
  }

  async getDetailedGuildMembershipsWithRoles(ethAddress: string) {
    try {
      const memberships = await this.getGuildMemberships(ethAddress);

      const guilds = await Promise.all(
        memberships.map(async (membership) => {
          const guild = await this.getGuild(membership.guildId);
          return guild;
        }),
      );

      const objectifiedGuildRoles = guilds.map((guild) => {
        const objectifiedRoles = guild.roles.reduce((acc, role) => {
          acc[role.id] = role;
          return acc;
        }, {});
        return objectifiedRoles;
      });
      const objectifiedGuilds = guilds.reduce((acc, guild, index) => {
        acc[guild.id] = guild;
        acc[guild.id].roles = objectifiedGuildRoles[index];
        return acc;
      }, {});

      const detailedMemberships = memberships.map((membership, index) => {
        return {
          guildId: membership.guildId,
          guildName: objectifiedGuilds[membership.guildId].name,
          guildImage: objectifiedGuilds[membership.guildId].imageUrl,
          guildUrl: objectifiedGuilds[membership.guildId].urlName,
          roles: membership.roleIds.map((role) => {
            return {
              name: objectifiedGuilds[membership.guildId].roles[role].name,
              id: role,
              description:
                objectifiedGuilds[membership.guildId].roles[role].description,
            };
          }),
        };
      });

      return detailedMemberships;
    } catch (e) {
      console.log({ e });
      throw new InternalServerErrorException();
    }
  }
}
