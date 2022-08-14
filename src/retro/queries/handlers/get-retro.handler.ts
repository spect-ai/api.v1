import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { DetailedRetroResponseDto } from 'src/retro/dto/detailed-retro-response.dto';
import { Retro } from 'src/retro/models/retro.model';
import { RetroRepository } from 'src/retro/retro.repository';
import {
  GetMultipleRetrosQuery,
  GetRetroByIdQuery,
  GetRetroBySlugQuery,
} from '../impl';

@QueryHandler(GetRetroByIdQuery)
export class GetRetroByIdQueryHandler
  implements IQueryHandler<GetRetroByIdQuery>
{
  constructor(private readonly retroRepository: RetroRepository) {}

  async execute(query: GetRetroByIdQuery): Promise<Retro> {
    return await this.retroRepository.getRetroById(
      query.id,
      query.customPopulate,
      query.selectedFields,
    );
  }
}

@QueryHandler(GetMultipleRetrosQuery)
export class GetMultipleRetrosQueryHandler
  implements IQueryHandler<GetMultipleRetrosQuery>
{
  constructor(private readonly retroRepository: RetroRepository) {}

  async execute(query: GetMultipleRetrosQuery): Promise<Retro[]> {
    return await this.retroRepository.getRetros(
      query.filterQuery,
      query.customPopulate,
      query.selectedFields,
    );
  }
}

@QueryHandler(GetRetroBySlugQuery)
export class GetCircleBySlugQueryHandler
  implements IQueryHandler<GetRetroBySlugQuery>
{
  constructor(private readonly retroRepository: RetroRepository) {}

  async execute(query: GetRetroBySlugQuery): Promise<Retro> {
    return await this.retroRepository.getRetroBySlug(
      query.slug,
      query.customPopulate,
      query.selectedFields,
    );
  }
}
