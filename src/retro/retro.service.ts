import {
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { RequestProvider } from 'src/users/user.provider';
import { CreateRetroCommand } from './commands/impl';
import { UpdateRetroCommand } from './commands/impl/update-retro.command';
import { CreateRetroRequestDto } from './dto/create-retro-request.dto';
import { DetailedRetroResponseDto } from './dto/detailed-retro-response.dto';
import { UpdateRetroRequestDto } from './dto/update-retro-request.dto';
import { Retro } from './models/retro.model';
import { GetRetroByIdQuery, GetRetroBySlugQuery } from './queries/impl';
import { RetroRepository } from './retro.repository';

@Injectable()
export class RetroService {
  constructor(
    private readonly requestProvider: RequestProvider,
    private readonly retroRepository: RetroRepository,
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  async create(
    createRetroDto: CreateRetroRequestDto,
  ): Promise<DetailedRetroResponseDto> {
    try {
      const createdRetro = await this.commandBus.execute(
        new CreateRetroCommand(createRetroDto),
      );
      return createdRetro;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(
        'Failed retro creation',
        error.message,
      );
    }
  }

  async update(
    id: string,
    updateRetroDto: UpdateRetroRequestDto,
  ): Promise<DetailedRetroResponseDto> {
    try {
      const updatedRetro = await this.commandBus.execute(
        new UpdateRetroCommand(id, updateRetroDto),
      );
      return updatedRetro;
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed retro update',
        error.message,
      );
    }
  }

  async getDetailedRetro(id: string): Promise<DetailedRetroResponseDto> {
    try {
      const retro = await this.queryBus.execute(new GetRetroByIdQuery(id));
      return retro;
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed while getting retro',
        error.message,
      );
    }
  }

  async getDetailedRetroBySlug(
    slug: string,
  ): Promise<DetailedRetroResponseDto> {
    try {
      const retro = await this.queryBus.execute(new GetRetroBySlugQuery(slug));
      return retro;
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed while getting retro',
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
