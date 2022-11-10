import {
  Controller,
  Get,
  UseGuards,
  Request,
  Patch,
  Body,
  Param,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { ApiTags } from '@nestjs/swagger';
import {
  PublicViewAuthGuard,
  SessionAuthGuard,
} from 'src/auth/iron-session.guard';
import { ReadNotificationDto, UpdateUserDto } from './dto/update-user.dto';
import { RequiredCardIdDto } from 'src/common/dtos/string.dto';
import { DetailedUserPubliceResponseDto } from './dto/detailed-user-response.dto';
import { CommandBus } from '@nestjs/cqrs';
import { ReadNotificationCommand } from './commands/notifications/impl';

@Controller('user')
@ApiTags('Users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly commandBus: CommandBus,
  ) {}

  @UseGuards(SessionAuthGuard)
  @Get('/me')
  findMe(@Request() req) {
    return this.usersService.getUserById(req.user.id);
  }

  // @UseGuards(SessionAuthGuard)
  @Get('/verifiedCircles/:id')
  async getMyVerifiedCircles(@Param('id') id: string) {
    return await this.usersService.getVerifiedCircles(id);
  }

  @UseGuards(PublicViewAuthGuard)
  @Get('/:id')
  findById(@Param('id') id: string) {
    return this.usersService.getUserById(id);
  }

  @UseGuards(PublicViewAuthGuard)
  @Get('/username/:username')
  findByUsername(@Param('username') username: string) {
    return this.usersService.getUserByUsername(username);
  }

  @UseGuards(PublicViewAuthGuard)
  @Get('/ethAddress/:ethAddress')
  findByEthAddress(@Param('ethAddress') ethAddress: string) {
    return this.usersService.getUserByEthAddress(ethAddress);
  }

  @UseGuards(SessionAuthGuard)
  @Patch('/me')
  update(@Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(updateUserDto);
  }

  @UseGuards(SessionAuthGuard)
  @Patch('/addBookmark/:cardId')
  async addBookmark(
    @Param() param: RequiredCardIdDto,
  ): Promise<DetailedUserPubliceResponseDto> {
    return await this.usersService.addItem('bookmarks', param.cardId);
  }

  @UseGuards(SessionAuthGuard)
  @Patch('/removeBookmark/:cardId')
  async removeBookmark(
    @Param() param: RequiredCardIdDto,
  ): Promise<DetailedUserPubliceResponseDto> {
    return await this.usersService.removeItem('bookmarks', param.cardId);
  }

  @UseGuards(SessionAuthGuard)
  @Patch('/readNotifications')
  async readNotifications(
    @Body() body: ReadNotificationDto,
    @Request() req,
  ): Promise<DetailedUserPubliceResponseDto> {
    return await this.commandBus.execute(
      new ReadNotificationCommand(body.notificationIds, req.user),
    );
  }
}
