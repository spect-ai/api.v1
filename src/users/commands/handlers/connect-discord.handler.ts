import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { User } from 'src/users/model/users.model';
import { UsersRepository } from 'src/users/users.repository';
import { LoggingService } from 'src/logging/logging.service';
import { ConnectDiscordCommand } from '../impl/connect-discord.command';
import { CirclesRepository } from 'src/circle/circles.repository';
import { JoinUsingDiscordCommand } from 'src/circle/commands/impl';

@CommandHandler(ConnectDiscordCommand)
export class ConnectDiscordCommandHandler
  implements ICommandHandler<ConnectDiscordCommand>
{
  constructor(
    private readonly userRepository: UsersRepository,
    private readonly circlesRepository: CirclesRepository,
    private readonly commandBus: CommandBus,
    private readonly logger: LoggingService,
  ) {
    this.logger.setContext('ConnectDiscordCommandHandler');
  }

  async execute(command: ConnectDiscordCommand): Promise<User> {
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
      const guildData = await userGuilds.json();
      const userData = await userResult.json();

      let userToUpdate = user;
      if (!userToUpdate)
        userToUpdate = await this.userRepository.findById(user.id);
      if (!userToUpdate) throw new Error('User not found');

      try {
        const guildIds = guildData.map((guild) => guild.id);
        console.log({ guildIds });
        if (guildIds?.length == 0) return;
        const guildCircles = await this.circlesRepository.findAll({
          $and: [
            {
              discordGuildId: { $in: guildIds },
              discordToCircleRoles: { $exists: true },
              private: false,
            },
          ],
        });
        console.log({ guildCircles });
        if (guildCircles?.length == 0) return;
        for await (const circle of guildCircles) {
          if (
            !circle?.members?.includes(user.id) &&
            circle?.status.archived == false
          ) {
            const id = circle?.id;
            console.log({ id });
            await this.commandBus.execute(
              new JoinUsingDiscordCommand(id, user),
            );
          }
        }
      } catch (error) {
        console.log(error);
      }

      return await this.userRepository.updateById(user.id, {
        discordId: userData.id,
        discordUsername:
          userData.username === undefined
            ? undefined
            : userData.username + '#' + userData.discriminator,
      });
    } catch (error) {
      this.logger.error(
        `Failed adding item to user with error: ${error}`,
        command,
      );
    }
  }
}
