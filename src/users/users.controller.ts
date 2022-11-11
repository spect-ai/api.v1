import {
  Controller,
  Get,
  UseGuards,
  Request,
  Patch,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { ApiTags } from '@nestjs/swagger';
import {
  PublicViewAuthGuard,
  SessionAuthGuard,
} from 'src/auth/iron-session.guard';
import { ReadNotificationDto, UpdateUserDto } from './dto/update-user.dto';
import { User } from './model/users.model';
import { ObjectIdDto } from 'src/common/dtos/object-id.dto';
import {
  RequiredCardIdDto,
  RequiredEducationId,
  RequiredExperienceId,
  RequiredHandle,
} from 'src/common/dtos/string.dto';
import { DetailedUserPubliceResponseDto } from './dto/detailed-user-response.dto';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ReadNotificationCommand } from './commands/notifications/impl';
import { LensService } from './external/lens.service';
import { AddExperienceDto, UpdateExperienceDto } from './dto/experience.dto';
import {
  AddExperienceCommand,
  RemoveExperienceCommand,
  UpdateExperienceCommand,
} from './commands/experience';
import {
  AddEducationCommand,
  RemoveEducationCommand,
  UpdateEducationCommand,
} from './commands/education';
import { AddEducationDto, UpdateEducationDto } from './dto/education.dto';
import {
  PrivateProfileResponseDto,
  PublicProfileResponseDto,
} from './dto/profile-response.dto';
import { GetProfileByIdQuery } from './queries/impl';

@Controller('user')
@ApiTags('Users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @UseGuards(PublicViewAuthGuard)
  @Get('/profile/:id')
  getProfile(
    @Param() param: ObjectIdDto,
    @Request() req,
  ): Promise<PublicProfileResponseDto | PrivateProfileResponseDto> {
    return this.queryBus.execute(
      new GetProfileByIdQuery(param.id, req.user?.id),
    );
  }
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
}
