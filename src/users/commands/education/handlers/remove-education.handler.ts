import { InternalServerErrorException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { LoggingService } from 'src/logging/logging.service';
import { UsersRepository } from 'src/users/users.repository';
import { RemoveEducationCommand } from '../impl/remove-education.command';

@CommandHandler(RemoveEducationCommand)
export class RemoveEducationCommandHandler
  implements ICommandHandler<RemoveEducationCommand>
{
  constructor(
    private readonly userRepository: UsersRepository,
    private readonly logger: LoggingService,
  ) {
    this.logger.setContext('RemoveEducationCommandHandler');
  }

  async execute(command: RemoveEducationCommand) {
    const { user, educationId } = command;
    try {
      const education = user.education || [];
      education.splice(parseInt(educationId), 1);

      const updatedCollection = await this.userRepository.updateById(user.id, {
        education,
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
