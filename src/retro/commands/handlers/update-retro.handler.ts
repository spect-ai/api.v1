import { InternalServerErrorException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Retro } from 'src/retro/models/retro.model';
import { RetroRepository } from 'src/retro/retro.repository';
import { UpdateRetroCommand } from '../impl/update-retro.command';

@CommandHandler(UpdateRetroCommand)
export class UpdateRetroCommandHandler
  implements ICommandHandler<UpdateRetroCommand>
{
  constructor(private readonly retroRepository: RetroRepository) {}

  async execute(command: UpdateRetroCommand): Promise<Retro> {
    try {
      const { id, updateRetroRequestDto } = command;
      const updatedRetro = await this.retroRepository
        .updateById(id, updateRetroRequestDto)
        .populate('circle');
      return updatedRetro;
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed retro update',
        error.message,
      );
    }
  }
}
