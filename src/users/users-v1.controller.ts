import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiTags } from '@nestjs/swagger';
import { SessionAuthGuard } from 'src/auth/iron-session.guard';
import {
  ConnectDiscordCommand,
  DisconnectDiscordCommand,
  GetReferralCodeCommand,
  GetTokensOfUserQuery,
  WithdrawBonusCommand,
} from './commands/impl';
import {
  ConnectGithubCommand,
  DisconnectGithubCommand,
} from './commands/impl/connect-github.command';
import { GetCirclesCommand } from './commands/metadata/impl/get-circles.command';
import { GetResponsesCommand } from './commands/metadata/impl/get-responses.command';
import { SetUnreadNotificationsCommand } from './commands/notifications/impl';
import { CirclesOfUserDto } from './dto/metadata-of-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import {
  GetMeQuery,
  GetNotificationsQuery,
  GetReferralsQuery,
  GetUnreadNotificationsQuery,
} from './queries/impl';
import { UsersService } from './users.service';
import { IsWhitelistedQuery } from './queries/impl/is-whitelisted.query';

@Controller('user/v1')
@ApiTags('user.v1')
export class UsersControllerV1 {
  constructor(
    private readonly usersService: UsersService,
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
  ) {}

  @UseGuards(SessionAuthGuard)
  @Get('/me')
  findMe(@Request() req) {
    return this.queryBus.execute(new GetMeQuery(req.user.id));
  }

  @UseGuards(SessionAuthGuard)
  @Patch('/me')
  update(@Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(updateUserDto);
  }

  @UseGuards(SessionAuthGuard)
  @Get('/circles')
  async getCircles(@Request() req): Promise<CirclesOfUserDto> {
    return await this.commandBus.execute(new GetCirclesCommand(req.user.id));
  }

  @UseGuards(SessionAuthGuard)
  @Get('/responses')
  async getResponses(@Request() req): Promise<CirclesOfUserDto> {
    return await this.commandBus.execute(new GetResponsesCommand(req.user.id));
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
  @Patch('/disconnectDiscord')
  disconnectDiscord(@Request() req) {
    return this.commandBus.execute(new DisconnectDiscordCommand(req.user));
  }

  @UseGuards(SessionAuthGuard)
  @Post('/apiKey')
  createAPIKey() {
    return this.usersService.createAPIKey();
  }

  @UseGuards(SessionAuthGuard)
  @Delete('/apiKey')
  deleteApiKey(@Body() body: { apiKey: string }) {
    return this.usersService.deleteApiKey(body.apiKey);
  }

  @UseGuards(SessionAuthGuard)
  @Get('/connectGithub')
  connectGithub(@Request() req, @Query('code') code: string) {
    return this.commandBus.execute(new ConnectGithubCommand(req.user, code));
  }

  @UseGuards(SessionAuthGuard)
  @Patch('/disconnectGithub')
  disconnectGithub(@Request() req) {
    return this.commandBus.execute(new DisconnectGithubCommand(req.user));
  }

  @UseGuards(SessionAuthGuard)
  @Get('/tokenBalances')
  async getTokenBalancesV2(
    @Request() req,
    @Query('tokenType') tokenType: 'erc20' | 'nft',
    @Query('circleId') circleId: string,
  ) {
    return await this.queryBus.execute(
      new GetTokensOfUserQuery(req.user, tokenType, circleId),
    );
  }

  @UseGuards(SessionAuthGuard)
  @Get('/isWhitelisted')
  async isWhitelisted(@Request() req) {
    return await this.queryBus.execute(new IsWhitelistedQuery(req.user));
  }

  @UseGuards(SessionAuthGuard)
  @Get('/referralCode')
  async getReferralCode(@Request() req) {
    return await this.commandBus.execute(new GetReferralCodeCommand(req.user));
  }

  @UseGuards(SessionAuthGuard)
  @Get('/referrals')
  async getReferrals(@Request() req) {
    return await this.queryBus.execute(new GetReferralsQuery(req.user));
  }

  @UseGuards(SessionAuthGuard)
  @Get('/withdrawBonus')
  async withdrawBonus(@Request() req) {
    return await this.commandBus.execute(new WithdrawBonusCommand(req.user));
  }
}
