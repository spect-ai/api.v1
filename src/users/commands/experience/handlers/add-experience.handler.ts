import { InternalServerErrorException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { LoggingService } from 'src/logging/logging.service';
import { UsersRepository } from 'src/users/users.repository';
import { AddExperienceCommand } from '../impl/add-experience.command';
import { v4 as uuidv4 } from 'uuid';

@CommandHandler(AddExperienceCommand)
export class AddExperienceCommandHandler
  implements ICommandHandler<AddExperienceCommand>
{
  constructor(
    private readonly userRepository: UsersRepository,
    private readonly logger: LoggingService,
  ) {
    this.logger.setContext('AddExperienceCommandHandler');
  }

  async execute(command: AddExperienceCommand) {
    const { user, experience } = command;
    try {
      const experienceId = uuidv4();
      const updatedCollection = await this.userRepository.updateById(user.id, {
        experiences: {
          ...(user.experiences || {}),
          [experienceId]: experience,
        },
        experienceOrder: [...(user.experienceOrder || []), experienceId],
      });
      return updatedCollection;
    } catch (err) {
      this.logger.error(`Failed adding experience to user with error ${err}`);
      throw new InternalServerErrorException(
        `Failed adding experience to user with error ${err}`,
      );
    }
  }
}
