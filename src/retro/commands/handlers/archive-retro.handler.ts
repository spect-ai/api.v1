import { InternalServerErrorException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CommonTools } from 'src/common/common.service';
import { Retro } from 'src/retro/models/retro.model';
import { RetroRepository } from 'src/retro/retro.repository';
import { ArchiveRetroCommand } from '../impl/archive-retro.command';

@CommandHandler(ArchiveRetroCommand)
export class ArchiveRetroCommandHandler
  implements ICommandHandler<ArchiveRetroCommand>
{
  constructor(
    private readonly retroRepository: RetroRepository,
    private readonly commonTools: CommonTools,
  ) {}

  async execute(command: ArchiveRetroCommand): Promise<Retro> {
    try {
      console.log('ArchiveRetroCommandHandler');
      const { retro } = command;
      const updatedRetro = await this.retroRepository.updateById(retro.id, {
        status: {
          ...retro.status,
          archived: true,
        },
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
