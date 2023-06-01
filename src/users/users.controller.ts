import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiTags } from '@nestjs/swagger';
import {
  PublicViewAuthGuard,
  SessionAuthGuard,
} from 'src/auth/iron-session.guard';
import { GetTokenMetadataCommand, GetTokensCommand } from './commands/impl';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersRepository } from './users.repository';
import { UsersService } from './users.service';

@Controller('user')
@ApiTags('user.v0')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly userRepository: UsersRepository,
  ) {}

  @UseGuards(SessionAuthGuard)
  @Get('/me')
  findMe(@Request() req) {
    return this.usersService.getUserById(req.user.id);
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
  @Get('/getTokenBalances/:chainId/:tokenType/:circleId')
  async getTokenBalances(
    @Request() req,
    @Param('chainId') chainId: string,
    @Param('tokenType') tokenType: string,
    @Param('circleId') circleId: string,
  ) {
    return await this.commandBus.execute(
      new GetTokensCommand(req.user, chainId, tokenType, circleId),
    );
  }

  @Post('/getTokenMetadata')
  async getTokenMetadata(
    @Body()
    body: {
      chainId: string;
      tokenType: string;
      tokenAddress: string;
      tokenId?: string;
    },
  ) {
    return await this.commandBus.execute(
      new GetTokenMetadataCommand(
        body.chainId,
        body.tokenType,
        body.tokenAddress,
        body.tokenId,
      ),
    );
  }
}
