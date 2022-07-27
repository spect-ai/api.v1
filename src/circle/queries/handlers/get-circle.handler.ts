import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { CirclesRepository } from 'src/circle/circles.repository';
import { DetailedCircleResponseDto } from 'src/circle/dto/detailed-circle-response.dto';
import {
  GetCircleBySlugQuery,
  GetCircleByIdQuery,
} from '../impl/get-circle.query';

@QueryHandler(GetCircleByIdQuery)
export class GetCircleByIdQueryHandler
  implements IQueryHandler<GetCircleByIdQuery>
{
  constructor(private readonly circleRepository: CirclesRepository) {}

  async execute(query: GetCircleByIdQuery): Promise<DetailedCircleResponseDto> {
    return await this.circleRepository.getCircleById(query.id);
  }
}

@QueryHandler(GetCircleBySlugQuery)
export class GetCircleBySlugQueryHandler
  implements IQueryHandler<GetCircleBySlugQuery>
{
  constructor(private readonly circleRepository: CirclesRepository) {}

  async execute(
    query: GetCircleBySlugQuery,
  ): Promise<DetailedCircleResponseDto> {
    return await this.circleRepository.findOne({ slug: query.slug });
  }
}
