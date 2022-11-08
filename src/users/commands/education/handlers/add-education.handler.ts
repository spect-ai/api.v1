import { InternalServerErrorException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { LoggingService } from 'src/logging/logging.service';
import { UsersRepository } from 'src/users/users.repository';
import { AddEducationCommand } from '../impl/add-education.command';
import { v4 as uuidv4 } from 'uuid';

@CommandHandler(AddEducationCommand)
export class AddEducationCommandHandler
  implements ICommandHandler<AddEducationCommand>
{
  constructor(
    private readonly userRepository: UsersRepository,
    private readonly logger: LoggingService,
  ) {
    this.logger.setContext('AddEducationCommandHandler');
  }

  async execute(command: AddEducationCommand) {
    const { user, education } = command;
    try {
      const educationId = uuidv4();
      const updatedCollection = await this.userRepository.updateById(user.id, {
        education: {
          ...(user.education || {}),
          [educationId]: education,
        },
        educationOrder: [...(user.educationOrder || []), educationId],
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
