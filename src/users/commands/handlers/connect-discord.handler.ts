import { InternalServerErrorException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import fetch from 'node-fetch';
import { LoggingService } from 'src/logging/logging.service';
import { UsersRepository } from 'src/users/users.repository';
import {
  ConnectDiscordCommand,
  DisconnectDiscordCommand,
} from '../impl/connect-discord.command';

@CommandHandler(ConnectDiscordCommand)
export class ConnectDiscordCommandHandler
  implements ICommandHandler<ConnectDiscordCommand>
{
  constructor(
    private readonly userRepository: UsersRepository,
    private readonly logger: LoggingService,
  ) {
    this.logger.setContext('ConnectDiscordCommandHandler');
  }

  async execute(command: ConnectDiscordCommand) {
    try {
      console.log('ConnectDiscordCommandHandler');
      const { user, code } = command;

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

      const oauthData: any = await oauthResult.json();
      const userResult = await fetch('https://discord.com/api/users/@me', {
        headers: {
          authorization: `${oauthData.token_type} ${oauthData.access_token}`,
        },
      });

      const userGuilds = await fetch(
        'https://discord.com/api/users/@me/guilds',
        {
          headers: {
            authorization: `${oauthData.token_type} ${oauthData.access_token}`,
          },
        },
      );
      const userData = await userResult.json();

      let userToUpdate = user;

      if (!userToUpdate)
        userToUpdate = await this.userRepository.findById(user.id);
      if (!userToUpdate) throw new Error('User not found');

      const profile = await this.userRepository.updateById(user.id, {
        discordId: userData.id,
        discordUsername: userData.username + '#' + userData.discriminator,
        discordAvatar: userData.avatar,
      });
      return {
        profile,
        userData,
      };
    } catch (error) {
      console.error(error);
      this.logger.error(`Failed connecting discord: ${error}`, command);
      throw new InternalServerErrorException(
        'Failed connecting discord',
        error,
      );
    }
  }
}

@CommandHandler(DisconnectDiscordCommand)
export class DisconnectDiscordCommandHandler
  implements ICommandHandler<DisconnectDiscordCommand>
{
  constructor(
    private readonly userRepository: UsersRepository,
    private readonly logger: LoggingService,
  ) {
    this.logger.setContext('DisconnectDiscordCommandHandler');
  }

  async execute(command: DisconnectDiscordCommand) {
    try {
      console.log('DisconnectDiscordCommandHandler');
      const { user } = command;

      let userToUpdate = user;

      if (!userToUpdate)
        userToUpdate = await this.userRepository.findById(user.id);
      if (!userToUpdate) throw new Error('User not found');

      const profile = await this.userRepository.updateById(user.id, {
        discordId: null,
        discordUsername: null,
        discordAvatar: null,
      });
      return {
        profile,
      };
    } catch (error) {
      console.error(error);
      this.logger.error(`Failed disconnecting discord: ${error}`, command);
      throw new InternalServerErrorException(
        'Failed disconnecting discord',
        error,
      );
    }
  }
}
