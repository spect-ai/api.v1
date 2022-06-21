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

@Controller('circle')
export class CirclesController {
  constructor(
    private readonly circlesService: CirclesService,
    private readonly circlesRepository: CirclesRepository,
    private readonly requestProvider: RequestProvider,
  ) {}

  @Get('/allPublicParents')
  async findAllParentCircles(): Promise<DetailedCircleResponseDto[]> {
    return await this.circlesRepository.getPublicParentCircles();
  }

  @Get('/myOrganizations')
  @UseGuards(SessionAuthGuard)
  async findMyOrganizations(): Promise<DetailedCircleResponseDto[]> {
    try {
      return await this.circlesRepository.getParentCirclesByUser(
        `62a54d4ecb7a9f9d6d22a9f9`,
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
      this.requestProvider.user,
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

  @Patch('/invite/:id')
  @UseGuards(SessionAuthGuard)
  async invite(
    @Param() param: ObjectIdDto,
    @Body() invitation: InviteDto,
  ): Promise<DetailedCircleResponseDto> {
    return await this.circlesService.invite(param.id, invitation);
  }

  @Patch('/joinUsingInvitation/:id')
  @ApiParam({ name: 'id', type: 'string' })
  @UseGuards(SessionAuthGuard)
  async join(
    @Param() param: ObjectIdDto,
    @Body() joinDto: JoinCircleUsingInvitationRequestDto,
  ): Promise<DetailedCircleResponseDto> {
    return await this.circlesService.joinUsingInvitation(param.id, joinDto);
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
