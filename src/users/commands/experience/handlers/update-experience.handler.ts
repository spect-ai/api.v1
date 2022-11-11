import { InternalServerErrorException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { LoggingService } from 'src/logging/logging.service';
import { UsersRepository } from 'src/users/users.repository';
import { UpdateExperienceCommand } from '../impl/update-experience.command';

@CommandHandler(UpdateExperienceCommand)
export class UpdateExperienceCommandHandler
  implements ICommandHandler<UpdateExperienceCommand>
{
  constructor(
    private readonly userRepository: UsersRepository,
    private readonly logger: LoggingService,
  ) {
    this.logger.setContext('UpdateExperienceCommandHandler');
  }

  async execute(command: UpdateExperienceCommand) {
    const { user, experience, experienceId } = command;
    try {
      const newExperiences = user.experiences || {};
      newExperiences[experienceId] = {
        ...newExperiences[experienceId],
        ...experience,
      };
      const updatedCollection = await this.userRepository.updateById(user.id, {
        experiences: newExperiences,
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
