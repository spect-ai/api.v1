import { Injectable } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { GetMultipleCirclesQuery } from 'src/circle/queries/impl';
import { CirclesOfUserDto } from '../dto/metadata-of-user.dto';
import { GetUserByIdQuery } from '../queries/impl';
import { UsersRepository } from '../users.repository';

@Injectable()
export class UserMetadataService {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly userRepository: UsersRepository,
  ) {}

  async getCirclesByUserId(userId: string): Promise<CirclesOfUserDto> {
    const user = await this.userRepository.findById(userId);
    const circles = await this.queryBus.execute(
      new GetMultipleCirclesQuery({
        _id: {
          $in: user?.circles || [],
        },
        'status.archived': false,
      }),
    );
    return circles.map((circle) => {
      return {
        name: circle.name,
        slug: circle.slug,
        description: circle.description,
        id: circle._id.toString(),
        avatar: circle.avatar,
      };
    });
  }
}
