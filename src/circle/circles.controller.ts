import {
  Body,
  Controller,
  Get,
  HttpException,
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
import { JoinCircleRequestDto } from './dto/join-circle.dto';
import { GetMemberDetailsOfCircleDto } from './dto/get-member-details.dto';
import { ApiParam, ApiQuery } from '@nestjs/swagger';
import { ObjectIdDto } from 'src/common/validators/object-id.dto';

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
    return await this.circlesRepository.getParentCirclesByUser(
      this.requestProvider.user._id,
    );
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
  async update(
    @Param() param: ObjectIdDto,
    @Body() circle: UpdateCircleRequestDto,
  ): Promise<DetailedCircleResponseDto> {
    return await this.circlesService.update(param.id, circle);
  }

  @Patch('/invite/:id')
  async invite(
    @Param() param: ObjectIdDto,
    @Body() invitation: InviteDto,
  ): Promise<DetailedCircleResponseDto> {
    return await this.circlesService.invite(param.id, invitation);
  }

  @Patch('/join/:id')
  async join(
    @Param() param: ObjectIdDto,
    @Body() joinDto: JoinCircleRequestDto,
  ): Promise<DetailedCircleResponseDto> {
    return await this.circlesService.join(param.id, joinDto);
  }

  @Post('/:id/delete')
  async delete(
    @Param() param: ObjectIdDto,
  ): Promise<DetailedCircleResponseDto> {
    return await this.circlesService.delete(param.id);
  }
}
