import { InternalServerErrorException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DetailedRetroResponseDto } from 'src/retro/dto/detailed-retro-response.dto';
import { Retro } from 'src/retro/models/retro.model';
import { RetroRepository } from 'src/retro/retro.repository';
import { UpdateRetroVoteCommand } from '../impl/update-retro-vote.command';

@CommandHandler(UpdateRetroVoteCommand)
export class UpdateRetroVoteCommandHandler
  implements ICommandHandler<UpdateRetroVoteCommand>
{
  constructor(private readonly retroRepository: RetroRepository) {}

  async execute(command: UpdateRetroVoteCommand): Promise<Retro> {
    try {
      const { caller, retro, updateRetroVoteRequestDto } = command;

      const ownerStats = retro.stats[caller];
      if (!ownerStats.canGive)
        throw new InternalServerErrorException('Caller can not vote');
      for (const [member, allocation] of Object.entries(
        updateRetroVoteRequestDto.votes,
      )) {
        if (!retro.stats[member].canReceive)
          throw new InternalServerErrorException('Member can not receive vote');
        if (member === caller) continue;
        ownerStats.votesRemaining = this.calculateRemainingVotes(
          ownerStats.votesRemaining,
          ownerStats.votesGiven[member],
          allocation,
          retro.strategy,
        );
        ownerStats.votesGiven[member] = allocation;
      }
      if (ownerStats.votesRemaining < 0)
        throw new InternalServerErrorException(
          'Caller has exceeded allocated votes',
        );
      const updatedRetro = await this.retroRepository
        .updateById(retro.id, {
          stats: {
            ...retro.stats,
            [caller]: ownerStats,
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

  calculateRemainingVotes(
    currRemaining: number,
    prevVal: number,
    newVal: number,
    strategy: string,
  ): any {
    if (strategy.toLowerCase() === 'normal voting') {
      return currRemaining - newVal + prevVal;
    } else if (strategy.toLowerCase() === 'quadratic voting') {
      return currRemaining - newVal ** 2 + prevVal ** 2;
    }
  }
}
