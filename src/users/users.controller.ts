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
  update(@Body() updateUserDto: UpdateUserDto, @Request() req) {
    return this.usersService.update(updateUserDto, req.user);
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.usersService.getUserPublicProfile(id);
  }

  @Get('/username/:username')
  findByUsername(@Param('username') username: string) {
    return this.usersService.getUserPublicProfileByUsername(username);
  }
}
