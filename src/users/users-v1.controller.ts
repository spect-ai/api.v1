import { Controller, Get, Param, Request, UseGuards } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiTags } from '@nestjs/swagger';
import { PublicViewAuthGuard } from 'src/auth/iron-session.guard';
import { ObjectIdDto } from 'src/common/dtos/object-id.dto';
import {
  PrivateProfileResponseDto,
  PublicProfileResponseDto,
} from './dto/profile-response.dto';
import { GetProfileByIdQuery } from './queries/impl';
import { UsersService } from './users.service';

@Controller('user/v1')
@ApiTags('Users')
export class UsersControllerV1 {
  constructor(
    private readonly usersService: UsersService,
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @UseGuards(PublicViewAuthGuard)
  @Get('/:id/profile')
  getProfile(
    @Param() param: ObjectIdDto,
    @Request() req,
  ): Promise<PublicProfileResponseDto | PrivateProfileResponseDto> {
    return this.queryBus.execute(
      new GetProfileByIdQuery(param.id, req.user?.id),
    );
  }
}
