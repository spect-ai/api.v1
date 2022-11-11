import { Controller, Get, Param, Request, UseGuards } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiTags } from '@nestjs/swagger';
import {
  PublicViewAuthGuard,
  SessionAuthGuard,
} from 'src/auth/iron-session.guard';
import { ObjectIdDto } from 'src/common/dtos/object-id.dto';
import { RequiredUsernameDto } from 'src/common/dtos/string.dto';
import {
  PrivateProfileResponseDto,
  PublicProfileResponseDto,
} from './dto/profile-response.dto';
import { LensService } from './external/lens.service';
import { GetProfileByIdQuery } from './queries/impl';
import { UsersService } from './users.service';

@Controller('user/v1')
@ApiTags('Users')
export class UsersControllerV1 {
  constructor(
    private readonly usersService: UsersService,
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly lensService: LensService,
  ) {}

  @UseGuards(PublicViewAuthGuard)
  @Get('/:id/profile')
  getProfile(
    @Param() param: ObjectIdDto,
    @Request() req,
  ): Promise<PublicProfileResponseDto | PrivateProfileResponseDto> {
    return this.queryBus.execute(
      new GetProfileByIdQuery(
        {
          _id: param.id,
        },
        req.user?.id,
      ),
    );
  }

  @UseGuards(PublicViewAuthGuard)
  @Get('/username/:username/profile')
  getProfileWithUsername(
    @Param() param: RequiredUsernameDto,
    @Request() req,
  ): Promise<PublicProfileResponseDto | PrivateProfileResponseDto> {
    return this.queryBus.execute(
      new GetProfileByIdQuery(
        {
          username: param.username,
        },
        req.user?.id,
      ),
    );
  }

  @UseGuards(SessionAuthGuard)
  @Get('/lensHandles')
  getLensHandles(
    @Request() req,
  ): Promise<PublicProfileResponseDto | PrivateProfileResponseDto> {
    return this.lensService.getLensProfilesByAddress(req.user.ethAddress);
  }
}
