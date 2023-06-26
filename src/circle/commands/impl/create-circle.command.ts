import {
  CreateCircleRequestDto,
  CreateClaimableCircleRequestDto,
} from 'src/circle/dto/create-circle-request.dto';
import { User } from 'src/users/model/users.model';

export class CreateCircleCommand {
  constructor(
    public readonly createCircleDto: CreateCircleRequestDto,
    public readonly caller: User,
  ) {}
}
