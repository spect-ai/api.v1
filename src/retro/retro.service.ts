import {
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { UserProvider } from 'src/users/user.provider';
import { CreateRetroRequestDto } from './dto/create-retro-request.dto';
import { DetailedRetroResponseDto } from './dto/detailed-retro-response.dto';
import { UpdateRetroRequestDto } from './dto/update-retro-request.dto';
import { Retro } from './models/retro.model';
import { RetroRepository } from './retro.repository';

@Injectable()
export class RetroService {
  constructor(
    private readonly userProvider: UserProvider,
    private readonly retroRepository: RetroRepository,
  ) {}

  async create(
    createRetroDto: CreateRetroRequestDto,
  ): Promise<DetailedRetroResponseDto> {
    return await this.retroRepository.create(createRetroDto);
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
