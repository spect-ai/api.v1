import { InternalServerErrorException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { LoggingService } from 'src/logging/logging.service';
import { UsersRepository } from 'src/users/users.repository';
import { UpdateEducationCommand } from '../impl/update-education.command';

@CommandHandler(UpdateEducationCommand)
export class UpdateEducationCommandHandler
  implements ICommandHandler<UpdateEducationCommand>
{
  constructor(
    private readonly userRepository: UsersRepository,
    private readonly logger: LoggingService,
  ) {
    this.logger.setContext('UpdateEducationCommandHandler');
  }

  async execute(command: UpdateEducationCommand) {
    const { user, education, educationId } = command;
    try {
      const updatedCollection = await this.userRepository.updateById(user.id, {
        education: [...(user.education || []), education],
      });
      return updatedCollection;
    } catch (err) {
      this.logger.error(`Failed adding education to user with error ${err}`);
      throw new InternalServerErrorException(
        `Failed adding education to user with error ${err}`,
      );
    }
  }
}
