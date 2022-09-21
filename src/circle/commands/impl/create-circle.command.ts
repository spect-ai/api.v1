import {
  CreateCircleRequestDto,
  CreateClaimableCircleRequestDto,
} from 'src/circle/dto/create-circle-request.dto';

export class CreateCircleCommand {
  constructor(
    public readonly createCircleDto: CreateCircleRequestDto,
    public readonly caller: string,
  ) {}
}

export class CreateClaimableCircleCommand {
  constructor(
    public readonly createCircleDto: CreateClaimableCircleRequestDto,
  ) {}
}
