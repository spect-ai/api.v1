import { InternalServerErrorException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CommonTools } from 'src/common/common.service';
import { DetailedRetroResponseDto } from 'src/retro/dto/detailed-retro-response.dto';
import { Retro } from 'src/retro/models/retro.model';
import { RetroRepository } from 'src/retro/retro.repository';
import { EndRetroCommand } from '../impl';

@CommandHandler(EndRetroCommand)
export class EndRetroCommandHandler
  implements ICommandHandler<EndRetroCommand>
{
  constructor(
    private readonly retroRepository: RetroRepository,
    private readonly commonTools: CommonTools,
  ) {}

  async execute(command: EndRetroCommand): Promise<Retro> {
    try {
      const { retro } = command;
      let distribution = {} as { [member: string]: number };
      for (const [, stats] of Object.entries(retro.stats)) {
        for (const [member, allocation] of Object.entries(stats.votesGiven)) {
          distribution = this.commonTools.setOrAggregateObjectKey(
            distribution,
            member,
            allocation,
          ) as { [member: string]: number };
        }
      }
      const total = Object.values(distribution).reduce(
        (acc: number, curr: number) => acc + curr,
        0,
      );

      for (const [member, allocation] of Object.entries(distribution)) {
        distribution[member] = allocation / total;
      }

      const updatedRetro = await this.retroRepository
        .updateById(retro.id, {
          distribution,
          status: {
            ...retro.status,
            active: false,
          },
        })
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
