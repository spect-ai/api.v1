import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DetailedRetroResponseDto } from 'src/retro/dto/detailed-retro-response.dto';
import { CreateRetroCommand } from '../impl';
import { QueryBus } from '@nestjs/cqrs';
import { GetCircleByIdQuery } from 'src/circle-v1/queries/impl';
import { InternalServerErrorException } from '@nestjs/common';
import { MappedStats } from 'src/retro/types';
import { MemberStats } from 'src/retro/dto/create-retro-request.dto';
import { RetroRepository } from 'src/retro/retro.repository';
import { RequestProvider } from 'src/users/user.provider';

@CommandHandler(CreateRetroCommand)
export class CreateRetroCommandHandler
  implements ICommandHandler<CreateRetroCommand>
{
  constructor(private readonly retroRepository: RetroRepository) {}

  async execute(
    command: CreateRetroCommand,
  ): Promise<DetailedRetroResponseDto> {
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
