import { InternalServerErrorException } from '@nestjs/common';
import { CommandHandler, ICommandHandler, QueryBus } from '@nestjs/cqrs';
import { DetailedRetroResponseDto } from 'src/retro/dto/detailed-retro-response.dto';
import { RetroRepository } from 'src/retro/retro.repository';
import { UpdateRetroCommand } from '../impl/update-retro.command';

@CommandHandler(UpdateRetroCommand)
export class UpdateRetroCommandHandler
  implements ICommandHandler<UpdateRetroCommand>
{
  constructor(private readonly retroRepository: RetroRepository) {}

  async execute(
    command: UpdateRetroCommand,
  ): Promise<DetailedRetroResponseDto> {
    try {
      const { id, updateRetroRequestDto } = command;
      console.log(id, updateRetroRequestDto);
      const updatedRetro = await this.retroRepository.updateById(
        id,
        updateRetroRequestDto,
      );
      return updatedRetro;
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed retro update',
        error.message,
      );
    }
  }
}
