import {
  Body,
  Controller,
  Get,
  HttpException,
  Param,
  Patch,
  Post,
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
import { ApiParam } from '@nestjs/swagger';

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

  @Get('/:circleIds/member/myPermissions')
  @UseGuards(SessionAuthGuard)
  @ApiParam({ name: 'circleIds', type: 'array' })
  async getMyRoles(@Param('circleIds') circleIds): Promise<any> {
    circleIds = circleIds.split(',');
    return await this.circlesService.getCollatedUserPermissions(
      circleIds,
      this.requestProvider.user,
    );
  }

  @Get('/:circleIds/member/details')
  @ApiParam({ name: 'circleIds', type: 'array' })
  async getMemberDetailsOfCircles(@Param('circleIds') circleIds): Promise<any> {
    circleIds = circleIds.split(',');
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
  async findByObjectId(@Param('id') id): Promise<DetailedCircleResponseDto> {
    return await this.circlesRepository.getCircleWithPopulatedReferences(id);
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
    @Param('id') id,
    @Body() circle: UpdateCircleRequestDto,
  ): Promise<DetailedCircleResponseDto> {
    return await this.circlesService.update(id, circle);
  }

  @Patch('/invite/:id')
  async invite(
    @Param('id') id,
    @Body() invitation: InviteDto,
  ): Promise<DetailedCircleResponseDto> {
    return await this.circlesService.invite(id, invitation);
  }

  @Patch('/join/:id')
  async join(
    @Param('id') id,
    @Body() joinDto: JoinCircleRequestDto,
  ): Promise<DetailedCircleResponseDto> {
    return await this.circlesService.join(id, joinDto);
  }

  @Post('/:id/delete')
  async delete(@Param('id') id): Promise<DetailedCircleResponseDto> {
    return await this.circlesService.delete(id);
  }
}
