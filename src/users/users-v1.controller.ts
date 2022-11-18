import { Controller, Get, Param, Request, UseGuards } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiTags } from '@nestjs/swagger';
import {
  PublicViewAuthGuard,
  SessionAuthGuard,
} from 'src/auth/iron-session.guard';
import { ObjectIdDto } from 'src/common/dtos/object-id.dto';
import { RequiredUsernameDto } from 'src/common/dtos/string.dto';
import { GetCirclesCommand } from './commands/metadata/impl/get-circles.command';
import { GetResponsesCommand } from './commands/metadata/impl/get-responses.command';
import { CirclesOfUserDto } from './dto/metadata-of-user.dto';
import {
  PrivateProfileResponseDto,
  PublicProfileResponseDto,
} from './dto/profile-response.dto';
import { LensService } from './external/lens.service';
import { GetMeQuery, GetProfileByIdQuery } from './queries/impl';
import { UsersService } from './users.service';

@Controller('user/v1')
@ApiTags('user.v1')
export class UsersControllerV1 {
  constructor(
    private readonly usersService: UsersService,
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
    private readonly lensService: LensService,
  ) {}

  @UseGuards(SessionAuthGuard)
  @Get('/me')
  findMe(@Request() req) {
    return this.queryBus.execute(new GetMeQuery(req.user.id));
  }

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

  @UseGuards(PublicViewAuthGuard)
  @Get('/:id/circles')
  async getCircles(@Param() param: ObjectIdDto): Promise<CirclesOfUserDto> {
    return await this.commandBus.execute(new GetCirclesCommand(param.id));
  }

  @UseGuards(PublicViewAuthGuard)
  @Get('/:id/responses')
  async getResponses(@Param() param: ObjectIdDto): Promise<CirclesOfUserDto> {
    return await this.commandBus.execute(new GetResponsesCommand(param.id));
  }

  @Get('/verifiedCircles/:address')
  async getMyVerifiedCircles(@Param('address') address: string) {
    return await this.usersService.getVerifiedCircles(address);
  }
}
