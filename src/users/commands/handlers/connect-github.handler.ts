import { InternalServerErrorException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import fetch from 'node-fetch';
import { LoggingService } from 'src/logging/logging.service';
import { UsersRepository } from 'src/users/users.repository';
import {
  ConnectGithubCommand,
  DisconnectGithubCommand,
} from '../impl/connect-github.command';

@CommandHandler(ConnectGithubCommand)
export class ConnectGithubCommandHandler
  implements ICommandHandler<ConnectGithubCommand>
{
  constructor(
    private readonly userRepository: UsersRepository,
    private readonly logger: LoggingService,
  ) {
    this.logger.setContext('ConnectGithubCommandHandler');
  }

  async execute(command: ConnectGithubCommand) {
    try {
      console.log('ConnectGithubCommandHandler');
      const { user, code } = command;

      const oauthResult = await fetch(
        `https://github.com/login/oauth/access_token?client_id=${
          process.env.GITHUB_CLIENT_ID
        }&client_secret=${process.env.GITHUB_CLIENT_SECRET}&code=${
          code as string
        }`,
        {
          method: 'POST',
          headers: {
            Accept: 'application/json',
          },
        },
      );
      console.log({ oauthResult });
      const oauthData: any = await oauthResult.json();
      console.log({ oauthData });
      const userResult = await fetch('https://api.github.com/user', {
        headers: {
          authorization: `${oauthData.token_type} ${oauthData.access_token}`,
        },
      });
      const userData = await userResult.json();
      if (!userData?.id || !userData?.login)
        throw new Error('Couldnt find Github Id or Username while connecting');
      let userToUpdate = user;

      if (!userToUpdate)
        userToUpdate = await this.userRepository.findById(user.id);
      if (!userToUpdate) throw new Error('User not found');

      const profile = await this.userRepository.updateById(user.id, {
        githubId: userData.id,
        githubUsername: userData.login,
        githubAvatar: userData.avatar_url,
      });
      return {
        profile,
        userData,
      };
    } catch (error) {
      console.error(error);
      this.logger.error(`Failed connecting github: ${error}`, command);
      throw new InternalServerErrorException('Failed connecting github', error);
    }
  }
}

@CommandHandler(DisconnectGithubCommand)
export class DisconnectGithubCommandHandler
  implements ICommandHandler<DisconnectGithubCommand>
{
  constructor(
    private readonly userRepository: UsersRepository,
    private readonly logger: LoggingService,
  ) {
    this.logger.setContext('DisconnectGithubCommandHandler');
  }

  async execute(command: DisconnectGithubCommand) {
    try {
      console.log('DisconnectGithubCommandHandler');
      const { user } = command;

      let userToUpdate = user;

      if (!userToUpdate)
        userToUpdate = await this.userRepository.findById(user.id);
      if (!userToUpdate) throw new Error('User not found');

      const profile = await this.userRepository.updateById(user.id, {
        githubId: null,
        githubUsername: null,
        githubAvatar: null,
      });
      return {
        profile,
      };
    } catch (error) {
      console.error(error);
      this.logger.error(`Failed disconnecting github: ${error}`, command);
      throw new InternalServerErrorException(
        'Failed disconnecting github',
        error,
      );
    }
  }
}
