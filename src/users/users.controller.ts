import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { LocalAuthGuard } from 'src/auth/local-auth.gaurd';
import { ApiTags } from '@nestjs/swagger';
import { ConnectUserDto } from './dto/connect-user.dto';

@Controller('users')
@ApiTags('Users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('/connect')
  connect(@Body() body: ConnectUserDto) {
    return this.usersService.connect(body);
  }

  @UseGuards(LocalAuthGuard)
  @Get('/me')
  findMe(@Request() req) {
    return req.user;
  }

  // @Get(':id')
  // findOne(@Param('id') id: string) {
  //   return this.usersService.findOne(+id);
  // }

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
  //   return this.usersService.update(+id, updateUserDto);
  // }

  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.usersService.remove(+id);
  // }
}
