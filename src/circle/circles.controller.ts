import {
  Body,
  Controller,
  Get,
  HttpException,
  InternalServerErrorException,
  Param,
  ParseArrayPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SessionAuthGuard } from 'src/auth/iron-session.guard';
import { CirclesService } from './circles.service';
import { CirclesRepository } from './circles.repository';
import { CreateCircleRequestDto } from './dto/create-circle-request.dto';
import { DetailedCircleResponseDto } from './dto/detailed-circle-response.dto';
import { UpdateCircleRequestDto } from './dto/update-circle-request.dto';
import { RequestProvider } from 'src/users/user.provider';
import { InviteDto } from './dto/invite.dto';
import { JoinCircleUsingInvitationRequestDto } from './dto/join-circle.dto';
import { GetMemberDetailsOfCircleDto } from './dto/get-member-details.dto';
import { ApiParam, ApiQuery } from '@nestjs/swagger';
import { ObjectIdDto } from 'src/common/dtos/object-id.dto';
import { UpdateMemberRolesDto } from './dto/update-member-role.dto';
import { MemberDto } from './dto/params.dto';
import { CircleRegistryService } from './registry.circle.service';
import { AddNewTokenDto } from 'src/registry/dto/add-new-token.dto';
import { UpdateBlacklistDto } from './dto/update-local-registry.dto';

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

  @Get('/slug/:slug')
  async findBySlug(@Param('slug') slug): Promise<DetailedCircleResponseDto> {
    return await this.circlesService.getCircleWithSlug(slug);
  }

  @Get('/:id')
  async findByObjectId(
    @Param() param: ObjectIdDto,
  ): Promise<DetailedCircleResponseDto> {
    return await this.circlesRepository.getCircleWithPopulatedReferences(
      param.id,
    );
  }

  @Get('/:id/getRegistry')
  async getRegistry(@Param() param: ObjectIdDto) {
    return await this.circleRegistryService.getPaymentMethods(
      param.id.toString(),
    );
  }

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

  @Post('/')
  @UseGuards(SessionAuthGuard)
  async create(
    @Body() circle: CreateCircleRequestDto,
  ): Promise<DetailedCircleResponseDto> {
    return await this.circlesService.create(circle);
  }

  @Patch('/:id')
  @UseGuards(SessionAuthGuard)
  async update(
    @Param() param: ObjectIdDto,
    @Body() circle: UpdateCircleRequestDto,
  ): Promise<DetailedCircleResponseDto> {
    return await this.circlesService.update(param.id, circle);
  }

  @Patch('/:id/invite')
  @UseGuards(SessionAuthGuard)
  async invite(
    @Param() param: ObjectIdDto,
    @Body() invitation: InviteDto,
  ): Promise<DetailedCircleResponseDto> {
    return await this.circlesService.invite(param.id, invitation);
  }

  @Patch('/:id/joinUsingInvitation')
  @ApiParam({ name: 'id', type: 'string' })
  @UseGuards(SessionAuthGuard)
  async joinUsingInvitation(
    @Param() param: ObjectIdDto,
    @Body() joinDto: JoinCircleUsingInvitationRequestDto,
  ): Promise<DetailedCircleResponseDto> {
    return await this.circlesService.joinUsingInvitation(param.id, joinDto);
  }

  @Patch('/:id/joinUsingDiscord')
  @ApiParam({ name: 'id', type: 'string' })
  @UseGuards(SessionAuthGuard)
  async joinUsingDiscord(
    @Param() param: ObjectIdDto,
  ): Promise<DetailedCircleResponseDto> {
    return await this.circlesService.joinUsingDiscord(param.id);
  }

  @Patch('/:id/updateMemberRoles')
  @UseGuards(SessionAuthGuard)
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

  @UseGuards(SessionAuthGuard)
  @Post('/:id/delete')
  @UseGuards(SessionAuthGuard)
  async delete(
    @Param() param: ObjectIdDto,
  ): Promise<DetailedCircleResponseDto> {
    return await this.circlesService.delete(param.id);
  }
}
