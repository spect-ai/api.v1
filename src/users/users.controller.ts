import {
  Body,
  Controller,
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
import {
  RequiredCardIdDto,
  RequiredEducationId,
  RequiredExperienceId,
} from 'src/common/dtos/string.dto';
import {
  AddEducationCommand,
  RemoveEducationCommand,
  UpdateEducationCommand,
} from './commands/education';
import {
  AddExperienceCommand,
  RemoveExperienceCommand,
  UpdateExperienceCommand,
} from './commands/experience';
import { GetTokenMetadataCommand, GetTokensCommand } from './commands/impl';
import { ReadNotificationCommand } from './commands/notifications/impl';
import { DetailedUserPubliceResponseDto } from './dto/detailed-user-response.dto';
import { AddEducationDto, UpdateEducationDto } from './dto/education.dto';
import { AddExperienceDto, UpdateExperienceDto } from './dto/experience.dto';
import { ReadNotificationDto, UpdateUserDto } from './dto/update-user.dto';
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

  @UseGuards(SessionAuthGuard)
  @Patch('/me/addExperience')
  async addExperience(
    @Body() addExperienceDto: AddExperienceDto,
    @Request() req,
  ) {
    return await this.commandBus.execute(
      new AddExperienceCommand(addExperienceDto, req.user),
    );
  }

  @UseGuards(SessionAuthGuard)
  @Patch('/me/updateExperience')
  async updateExperience(
    @Query() experience: RequiredExperienceId,
    @Body() updateExperienceDto: UpdateExperienceDto,
    @Request() req,
  ) {
    return await this.commandBus.execute(
      new UpdateExperienceCommand(
        experience.experienceId,
        updateExperienceDto,
        req.user,
      ),
    );
  }

  @UseGuards(SessionAuthGuard)
  @Patch('/me/removeExperience')
  async removeExperience(
    @Query() experience: RequiredExperienceId,
    @Request() req,
  ) {
    return await this.commandBus.execute(
      new RemoveExperienceCommand(experience.experienceId, req.user),
    );
  }

  @UseGuards(SessionAuthGuard)
  @Patch('/me/addEducation')
  async addEducation(@Body() addEducationDto: AddEducationDto, @Request() req) {
    console.log(addEducationDto);
    return await this.commandBus.execute(
      new AddEducationCommand(addEducationDto, req.user),
    );
  }

  @UseGuards(SessionAuthGuard)
  @Patch('/me/updateEducation')
  async updateEducation(
    @Query() education: RequiredEducationId,
    @Body() updateEducationDto: UpdateEducationDto,
    @Request() req,
  ) {
    return await this.commandBus.execute(
      new UpdateEducationCommand(
        education.educationId,
        updateEducationDto,
        req.user,
      ),
    );
  }

  @UseGuards(SessionAuthGuard)
  @Patch('/me/removeEducation')
  async removeEducation(
    @Query() education: RequiredEducationId,
    @Request() req,
  ) {
    return await this.commandBus.execute(
      new RemoveEducationCommand(education.educationId, req.user),
    );
  }

  @Patch('/migrateSkills')
  async migrateSkills() {
    const users = await this.userRepository.findAll();
    let i = 0;
    for (const user of users) {
      if (user.skills) {
        const skills = user.skills.map((skill) => {
          return {
            title: skill,
            icon: '',
            linkedCredentials: [],
            nfts: [],
            poaps: [],
          };
        });
        await this.userRepository.updateById(user.id, { skillsV2: skills });
        i++;
      }
    }
    return i;
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
