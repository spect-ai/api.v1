import { InternalServerErrorException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { MemberStats } from 'src/retro/dto/create-retro-request.dto';
import { DetailedRetroResponseDto } from 'src/retro/dto/detailed-retro-response.dto';
import { Retro } from 'src/retro/models/retro.model';
import { RetroRepository } from 'src/retro/retro.repository';
import { MappedStats } from 'src/retro/types';
import { CreateRetroCommand } from '../impl';

@CommandHandler(CreateRetroCommand)
export class CreateRetroCommandHandler
  implements ICommandHandler<CreateRetroCommand>
{
  constructor(private readonly retroRepository: RetroRepository) {}

  async execute(command: CreateRetroCommand): Promise<Retro> {
    try {
      const { createRetroRequestDto, circle, caller } = command;

      if (!createRetroRequestDto.reward)
        createRetroRequestDto.reward = { ...circle.defaultPayment, value: 0 };
      const stats = this.initStats(createRetroRequestDto.memberStats);
      const retroNum = await this.retroRepository.count({
        circle: createRetroRequestDto.circle,
      });
      const members = createRetroRequestDto.memberStats.map((m) => m.member);
      return await this.retroRepository.create({
        ...createRetroRequestDto,
        slug: `${circle.slug}-${retroNum.toString()}`,
        stats: stats,
        members: members,
        creator: caller,
      });
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed retro creation',
        error.message,
      );
    }
  }

  initStats(memberStats: MemberStats[]): MappedStats {
    const stats = {} as MappedStats;
    const votesGiven = {};
    for (const memberStat of memberStats) {
      votesGiven[memberStat.member?.toString()] = 0;
    }
    for (const memberStat of memberStats) {
      stats[memberStat.member.toString()] = {
        owner: memberStat.member,
        votesGiven: votesGiven,
        votesRemaining: memberStat.allocation,
        votesAllocated: memberStat.allocation,
        canGive: memberStat.canGive,
        canReceive: memberStat.canReceive,
      };
    }
    return stats;
  }
}
