import {
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { CirclesRepository } from 'src/circle/circles.repository';
import { RequestProvider } from 'src/users/user.provider';
import {
  CreateRetroRequestDto,
  MemberStats,
} from './dto/create-retro-request.dto';
import { DetailedRetroResponseDto } from './dto/detailed-retro-response.dto';
import { UpdateRetroRequestDto } from './dto/update-retro-request.dto';
import { Retro } from './models/retro.model';
import { Stats } from './models/stats.model';
import { RetroRepository } from './retro.repository';

@Injectable()
export class RetroService {
  constructor(
    private readonly requestProvider: RequestProvider,
    private readonly retroRepository: RetroRepository,
    private readonly circleRepository: CirclesRepository,
  ) {}

  initStats(memberStats: MemberStats[]): Stats {
    const stats = {} as Stats;
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

  async create(
    createRetroDto: CreateRetroRequestDto,
  ): Promise<DetailedRetroResponseDto> {
    try {
      if (!createRetroDto.reward) {
        createRetroDto.reward = await this.circleRepository.getDefaultPayment(
          createRetroDto.circle,
        );
      }
      const stats = this.initStats(createRetroDto.memberStats);
      const retroNum = await this.retroRepository.count({
        circle: createRetroDto.circle,
      });
      return await this.retroRepository.create({
        ...createRetroDto,
        slug: retroNum.toString(),
        stats: stats,
      });
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed retro creation',
        error.message,
      );
    }
  }

  async getDetailedRetro(id: string): Promise<DetailedRetroResponseDto> {
    const retro = await this.retroRepository.getRetroWithPopulatedReferences(
      id,
    );
    return retro;
  }

  async getDetailedRetroBySlug(
    slug: string,
  ): Promise<DetailedRetroResponseDto> {
    const retro =
      await this.retroRepository.getRetroWithPopulatedReferencesBySlug(slug);
    return retro;
  }

  async update(
    id: string,
    updateRetroDto: UpdateRetroRequestDto,
  ): Promise<DetailedRetroResponseDto> {
    try {
      const updatedRetro = await this.retroRepository.updateById(
        id,
        updateRetroDto,
      );
      return updatedRetro;
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed retro update',
        error.message,
      );
    }
  }

  async delete(id: string): Promise<Retro> {
    const retro = await this.retroRepository.findById(id);
    if (!retro) {
      throw new HttpException('Retro not found', HttpStatus.NOT_FOUND);
    }
    return await this.retroRepository.deleteById(id);
  }
}
