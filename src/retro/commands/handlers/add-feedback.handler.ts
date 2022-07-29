import { InternalServerErrorException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DetailedRetroResponseDto } from 'src/retro/dto/detailed-retro-response.dto';
import { Retro } from 'src/retro/models/retro.model';
import { RetroRepository } from 'src/retro/retro.repository';
import { v4 as uuidv4 } from 'uuid';
import { AddFeedbackCommand } from '../impl/add-feedback.command';

@CommandHandler(AddFeedbackCommand)
export class AddFeedbackCommandHandler
  implements ICommandHandler<AddFeedbackCommand>
{
  constructor(private readonly retroRepository: RetroRepository) {}

  async execute(command: AddFeedbackCommand): Promise<Retro> {
    try {
      const { caller, retro, addFeedbackRequestDto } = command;
      if (!retro.feedbackGiven) retro.feedbackGiven = {};
      for (const [member, content] of Object.entries(
        addFeedbackRequestDto.feedback,
      )) {
        if (!retro.feedbackGiven[caller]) {
          retro.feedbackGiven[caller] = {};
        }
        retro.feedbackGiven[caller][member] = content;
      }

      const updatedRetro = await this.retroRepository.updateById(retro.id, {
        feedbackGiven: retro.feedbackGiven,
      });
      return updatedRetro;
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed retro update',
        error.message,
      );
    }
  }
}
