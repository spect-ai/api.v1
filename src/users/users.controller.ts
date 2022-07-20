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
import { SessionAuthGuard } from 'src/auth/iron-session.guard';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './model/users.model';
import { ObjectIdDto } from 'src/common/dtos/object-id.dto';
import { RequiredCardIdDto } from 'src/common/dtos/string.dto';
import { DetailedUserPubliceResponseDto } from './dto/detailed-user-response.dto';

@Controller('user')
@ApiTags('Users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(SessionAuthGuard)
  @Get('/me')
  findMe(@Request() req) {
    return req.user;
  }

  @UseGuards(SessionAuthGuard)
  @Patch('/me')
  update(@Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(updateUserDto);
  }

  @Get('/:id')
  findById(@Param('id') id: string) {
    return this.usersService.getUserPublicProfile(id);
  }

  @Get('/username/:username')
  findByUsername(@Param('username') username: string) {
    return this.usersService.getUserPublicProfileByUsername(username);
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
}
