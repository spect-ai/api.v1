import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  InternalServerErrorException,
  Param,
  ParseArrayPipe,
  Patch,
  Post,
  Query,
  SetMetadata,
  UseGuards,
} from '@nestjs/common';
import { SessionAuthGuard } from 'src/auth/iron-session.guard';
import { CircleAuthGuard, CreateCircleAuthGuard } from 'src/auth/circle.guard';
import { CirclesService } from './circles.service';
import { CirclesRepository } from './circles.repository';
import { CreateCircleRequestDto } from './dto/create-circle-request.dto';
import { DetailedCircleResponseDto } from './dto/detailed-circle-response.dto';
import { UpdateCircleRequestDto } from './dto/update-circle-request.dto';
import { RequestProvider } from 'src/users/user.provider';
import { InviteDto } from './dto/invite.dto';
import { JoinCircleUsingInvitationRequestDto } from './dto/join-circle.dto';
import { ApiParam, ApiQuery } from '@nestjs/swagger';
import { ObjectIdDto } from 'src/common/dtos/object-id.dto';
import { UpdateMemberRolesDto } from './dto/update-member-role.dto';
import { MemberDto } from './dto/params.dto';
import { CircleRegistryService } from './registry.circle.service';
import { AddNewTokenDto } from 'src/registry/dto/add-new-token.dto';
import { UpdateBlacklistDto } from './dto/update-local-registry.dto';
import { RequiredSlugDto } from 'src/common/dtos/string.dto';

@Controller('circle')
export class CirclesController {
  constructor(
    private readonly circlesService: CirclesService,
    private readonly circleRegistryService: CircleRegistryService,
    private readonly circlesRepository: CirclesRepository,
    private readonly requestProvider: RequestProvider,
  ) {}

  @Get('/allPublicParents')
  async findAllParentCircles(): Promise<DetailedCircleResponseDto[]> {
    try {
      return await this.circlesRepository.getPublicParentCircles();
    } catch (error) {
      console.log(error);
      return [];
    }
  }

  @Get('/myOrganizations')
  @UseGuards(SessionAuthGuard)
  async findMyOrganizations(): Promise<DetailedCircleResponseDto[]> {
    try {
      return await this.circlesRepository.getParentCirclesByUser(
        this.requestProvider.user.id,
      );
    } catch (e) {
      // TODO: Distinguish between DocumentNotFound error and other errors correctly, silent errors are not good
      console.log(e);
      return [] as DetailedCircleResponseDto[];
    }
  }

  @Get('/:circleIds/myPermissions')
  @UseGuards(SessionAuthGuard)
  @ApiQuery({ name: 'circleIds', type: 'array' })
  async getMyRoles(@Query('circleIds') circleIds: string[]): Promise<any> {
    if (circleIds.length === 0) {
      throw new HttpException('No circles provided', 400);
    }
    return await this.circlesService.getCollatedUserPermissions(
      circleIds,
      this.requestProvider.user.id,
    );
  }

  @Get('/:circleIds/memberDetails')
  @ApiQuery({ name: 'circleIds', type: 'array' })
  async getMemberDetailsOfCircles(
    @Query('circleIds') circleIds: string[],
  ): Promise<any> {
    if (circleIds.length === 0) {
      throw new HttpException('No circles provided', 400);
    }
    return await this.circlesService.getMemberDetailsOfCircles(circleIds);
  }

  @Get('/:circleSlugs/memberDetailsWithSlug')
  @ApiQuery({ name: 'circleSlugs', type: 'array' })
  async getMemberDetailsOfCirclesWithSlug(
    @Query('circleSlugs') circleSlugs: string[],
  ): Promise<any> {
    if (circleSlugs.length === 0) {
      throw new HttpException('No circles provided', 400);
    }
    return await this.circlesService.getMemberDetailsOfCirclesWithSlug(
      circleSlugs,
    );
  }

  @Get('/slug/:slug/getRegistry')
  async getRegistry(@Param() param: RequiredSlugDto) {
    return await this.circleRegistryService.getPaymentMethods(param.slug);
  }

  @Get('/slug/:slug')
  async findBySlug(
    @Param() param: RequiredSlugDto,
  ): Promise<DetailedCircleResponseDto> {
    return await this.circlesService.getCircleWithSlug(param.slug);
  }

  @Get('/:id')
  async findByObjectId(
    @Param() param: ObjectIdDto,
  ): Promise<DetailedCircleResponseDto> {
    return await this.circlesRepository.getCircleWithPopulatedReferences(
      param.id,
    );
  }

  @SetMetadata('permission', ['managePaymentOptions'])
  @UseGuards(CircleAuthGuard)
  @Patch('/:id/addToken')
  async addToken(
    @Param() param: ObjectIdDto,
    @Body() addTokenDto: AddNewTokenDto,
  ) {
    return await this.circleRegistryService.addToken(
      param.id.toString(),
      addTokenDto,
    );
  }

  @SetMetadata('permission', ['managePaymentOptions'])
  @UseGuards(CircleAuthGuard)
  @Patch('/:id/updateBlacklist')
  async updateBlacklist(
    @Param() param: ObjectIdDto,
    @Body() updateBlacklistDto: UpdateBlacklistDto,
  ) {
    return await this.circleRegistryService.updateBlacklist(
      param.id.toString(),
      updateBlacklistDto,
    );
  }

  @UseGuards(CreateCircleAuthGuard)
  @Post('/')
  async create(
    @Body() circle: CreateCircleRequestDto,
  ): Promise<DetailedCircleResponseDto> {
    return await this.circlesService.create(circle);
  }

  @SetMetadata('permissions', ['manageCircleSettings'])
  @UseGuards(CircleAuthGuard)
  @Patch('/:id')
  async update(
    @Param() param: ObjectIdDto,
    @Body() circle: UpdateCircleRequestDto,
  ): Promise<DetailedCircleResponseDto> {
    console.log({ circle });
    return await this.circlesService.update(param.id, circle);
  }

  @SetMetadata('permissions', ['inviteMembers'])
  @UseGuards(CircleAuthGuard)
  @Patch('/:id/invite')
  async invite(
    @Param() param: ObjectIdDto,
    @Body() invitation: InviteDto,
  ): Promise<DetailedCircleResponseDto> {
    return await this.circlesService.invite(param.id, invitation);
  }

  @ApiParam({ name: 'id', type: 'string' })
  @UseGuards(SessionAuthGuard)
  @Patch('/:id/joinUsingInvitation')
  async joinUsingInvitation(
    @Param() param: ObjectIdDto,
    @Body() joinDto: JoinCircleUsingInvitationRequestDto,
  ): Promise<DetailedCircleResponseDto> {
    return await this.circlesService.joinUsingInvitation(param.id, joinDto);
  }

  @ApiParam({ name: 'id', type: 'string' })
  @UseGuards(SessionAuthGuard)
  @Patch('/:id/joinUsingDiscord')
  async joinUsingDiscord(
    @Param() param: ObjectIdDto,
  ): Promise<DetailedCircleResponseDto> {
    return await this.circlesService.joinUsingDiscord(param.id);
  }

  @SetMetadata('permissions', ['manageMembers'])
  @UseGuards(CircleAuthGuard)
  @Patch('/:id/updateMemberRoles')
  async updateMemberRoles(
    @Param() param: ObjectIdDto,
    @Query() memberDto: MemberDto,
    @Body() updateMemberRolesDto: UpdateMemberRolesDto,
  ): Promise<DetailedCircleResponseDto> {
    return await this.circlesService.updateMemberRoles(
      param.id,
      memberDto.member,
      updateMemberRolesDto,
    );
  }

  @SetMetadata('permissions', ['manageMembers'])
  @UseGuards(CircleAuthGuard)
  @Patch('/:id/removeMember')
  async removeMember(
    @Param() param: ObjectIdDto,
    @Query() memberDto: MemberDto,
  ): Promise<DetailedCircleResponseDto> {
    return await this.circlesService.removeMember(param.id, memberDto.member);
  }

  // TODO: Delete everything withing the circle
  @SetMetadata('permissions', ['manageCircleSettings'])
  @UseGuards(CircleAuthGuard)
  @Delete('/:id/delete')
  async delete(
    @Param() param: ObjectIdDto,
  ): Promise<DetailedCircleResponseDto> {
    return await this.circlesService.delete(param.id);
  }
}
