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
      const newEducation = user.education || {};
      newEducation[educationId] = {
        ...newEducation[educationId],
        ...education,
      };
      const educationOrder = user.educationOrder || [];
      if (!educationOrder.includes(educationId)) {
        educationOrder.push(educationId);
      }

      const updatedCollection = await this.userRepository.updateById(user.id, {
        education: newEducation,
        educationOrder,
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
