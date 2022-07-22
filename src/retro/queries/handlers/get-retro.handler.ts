import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { DetailedRetroResponseDto } from 'src/retro/dto/detailed-retro-response.dto';
import { RetroRepository } from 'src/retro/retro.repository';
import { GetRetroByIdQuery, GetRetroBySlugQuery } from '../impl';

@QueryHandler(GetRetroByIdQuery)
export class GetRetroByIdQueryHandler
  implements IQueryHandler<GetRetroByIdQuery>
{
  constructor(private readonly retroRepository: RetroRepository) {}

  async execute(query: GetRetroByIdQuery): Promise<DetailedRetroResponseDto> {
    return await this.retroRepository.getRetroById(query.id);
  }
}

@QueryHandler(GetRetroBySlugQuery)
export class GetCircleBySlugQueryHandler
  implements IQueryHandler<GetRetroBySlugQuery>
{
  constructor(private readonly retroRepository: RetroRepository) {}

  async execute(query: GetRetroBySlugQuery): Promise<DetailedRetroResponseDto> {
    return await this.retroRepository.getRetroBySlug(query.slug);
  }
}
