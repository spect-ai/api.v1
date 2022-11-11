import { InternalServerErrorException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { LoggingService } from 'src/logging/logging.service';
import { UsersRepository } from 'src/users/users.repository';
import { RemoveExperienceCommand } from '../impl/remove-experience.command';

@CommandHandler(RemoveExperienceCommand)
export class RemoveExperienceCommandHandler
  implements ICommandHandler<RemoveExperienceCommand>
{
  constructor(
    private readonly userRepository: UsersRepository,
    private readonly logger: LoggingService,
  ) {
    this.logger.setContext('RemoveExperienceCommandHandler');
  }

  async execute(command: RemoveExperienceCommand) {
    const { user, experienceId } = command;
    try {
      const experiences = user.experiences || [];
      experiences.splice(parseInt(experienceId), 1);

      const updatedCollection = await this.userRepository.updateById(user.id, {
        experiences,
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
