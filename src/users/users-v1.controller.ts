import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
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
import { SetUnreadNotificationsCommand } from './commands/notifications/impl';
import { CirclesOfUserDto } from './dto/metadata-of-user.dto';
import {
  PrivateProfileResponseDto,
  PublicProfileResponseDto,
} from './dto/profile-response.dto';
import { LensService } from './external/lens.service';
import {
  GetMeQuery,
  GetNotificationsQuery,
  GetProfileQuery,
  GetUnreadNotificationsQuery,
} from './queries/impl';
import { UsersService } from './users.service';
import { ConnectDiscordCommand } from './commands/impl';

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
      new GetProfileQuery(
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
      new GetProfileQuery(
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
  @Get('/circles')
  async getCircles(@Request() req): Promise<CirclesOfUserDto> {
    return await this.commandBus.execute(new GetCirclesCommand(req.user.id));
  }

  @UseGuards(PublicViewAuthGuard)
  @Get('/responses')
  async getResponses(@Request() req): Promise<CirclesOfUserDto> {
    return await this.commandBus.execute(new GetResponsesCommand(req.user.id));
  }

  @Get('/verifiedCircles/:address')
  async getMyVerifiedCircles(@Param('address') address: string) {
    return await this.usersService.getVerifiedCircles(address);
  }

  @UseGuards(SessionAuthGuard)
  @Get('/notifications')
  getNotifications(
    @Request() req,
    @Query('limit') limit: number,
    @Query('page') page: number,
  ) {
    return this.queryBus.execute(
      new GetNotificationsQuery(req.user, limit, page),
    );
  }

  @UseGuards(SessionAuthGuard)
  @Get('/notifications/unread')
  getUnreadNotifications(@Request() req) {
    return this.queryBus.execute(new GetUnreadNotificationsQuery(req.user));
  }

  @UseGuards(SessionAuthGuard)
  @Patch('/notifications/unread')
  setUnreadNotifications(@Request() req) {
    return this.commandBus.execute(new SetUnreadNotificationsCommand(req.user));
  }

  @UseGuards(SessionAuthGuard)
  @Get('/connectDiscord')
  connectDiscord(@Request() req, @Query('code') code: string) {
    return this.commandBus.execute(new ConnectDiscordCommand(req.user, code));
  }

  @UseGuards(SessionAuthGuard)
  @Post('/apiKey')
  createAPIKey() {
    return this.usersService.createAPIKey();
  }

  @UseGuards(SessionAuthGuard)
  @Delete('/apiKey')
  deleteApiKey(@Body() body: { apiKey: string }) {
    console.log({ body });
    return this.usersService.deleteApiKey(body.apiKey);
  }
}
