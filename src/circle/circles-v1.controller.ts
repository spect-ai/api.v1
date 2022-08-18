import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  SetMetadata,
  UseGuards,
} from '@nestjs/common';
import { QueryBus, CommandBus } from '@nestjs/cqrs';
import { CircleAuthGuard, CreateCircleAuthGuard } from 'src/auth/circle.guard';
import { SessionAuthGuard } from 'src/auth/iron-session.guard';
import { ObjectIdDto } from 'src/common/dtos/object-id.dto';
import { RequiredRoleDto } from 'src/common/dtos/string.dto';
import { ArchiveCircleByIdCommand, ClaimCircleCommand } from './commands/impl';
import { AddSafeCommand, RemoveSafeCommand } from './commands/safe/impl';
import { CreateCircleRequestDto } from './dto/create-circle-request.dto';
import { DetailedCircleResponseDto } from './dto/detailed-circle-response.dto';
import { InviteDto } from './dto/invite.dto';
import { JoinCircleUsingInvitationRequestDto } from './dto/join-circle.dto';
import { MemberDto } from './dto/params.dto';
import { AddRoleDto, UpdateRoleDto } from './dto/roles-requests.dto';
import { SafeAddress } from './dto/safe-request.dto';
import { UpdateCircleRequestDto } from './dto/update-circle-request.dto';
import { UpdateMemberRolesDto } from './dto/update-member-role.dto';
import { Circle } from './model/circle.model';
import { GetCircleByIdQuery } from './queries/impl';
import { CirclesRolesService } from './services/circle-roles.service';
import { CirclesCrudService } from './services/circles-crud.service';
import { CircleMembershipService } from './services/circles-membership.service';

@Controller('circle/v1')
export class CircleV1Controller {
  constructor(
    private readonly circleMembershipService: CircleMembershipService,
    private readonly circleCrudService: CirclesCrudService,
    private readonly circleRoleServie: CirclesRolesService,
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
  ) {}

  @Get('/:id')
  async findByObjectId(@Param() param: ObjectIdDto): Promise<Circle> {
    return await this.queryBus.execute(
      new GetCircleByIdQuery(
        param.id,
        {
          projects: {
            title: 1,
            slug: 1,
            description: 1,
            id: 1,
          },
          retro: {
            title: 1,
            slug: 1,
            id: 1,
            status: 1,
            reward: 1,
            members: 1,
          },
          parents: {
            title: 1,
            slug: 1,
            description: 1,
            id: 1,
          },
          children: {
            title: 1,
            slug: 1,
            description: 1,
            id: 1,
          },
        },
        {
          invites: 0,
          localRegistry: 0,
        },
      ),
    );
  }

  @UseGuards(CreateCircleAuthGuard)
  @Post('/')
  async create(
    @Body() circle: CreateCircleRequestDto,
  ): Promise<DetailedCircleResponseDto> {
    return await this.circleCrudService.create(circle);
  }

  @SetMetadata('permissions', ['manageCircleSettings'])
  @UseGuards(CircleAuthGuard)
  @Patch('/:id')
  async update(
    @Param() param: ObjectIdDto,
    @Body() updateCircleRequestDto: UpdateCircleRequestDto,
  ): Promise<DetailedCircleResponseDto> {
    return await this.circleCrudService.update(
      param.id,
      updateCircleRequestDto,
    );
  }

  @SetMetadata('permissions', ['inviteMembers'])
  @UseGuards(CircleAuthGuard)
  @Patch('/:id/invite')
  async invite(
    @Param() param: ObjectIdDto,
    @Body() invitation: InviteDto,
  ): Promise<string> {
    return await this.circleMembershipService.invite(param.id, invitation);
  }

  @UseGuards(SessionAuthGuard)
  @Patch('/:id/joinUsingInvitation')
  async joinUsingInvitation(
    @Param() param: ObjectIdDto,
    @Body() joinDto: JoinCircleUsingInvitationRequestDto,
  ): Promise<DetailedCircleResponseDto> {
    return await this.circleMembershipService.joinUsingInvitation(
      param.id,
      joinDto,
    );
  }

  @UseGuards(SessionAuthGuard)
  @Patch('/:id/joinUsingDiscord')
  async joinUsingDiscord(
    @Param() param: ObjectIdDto,
  ): Promise<DetailedCircleResponseDto> {
    return await this.circleMembershipService.joinUsingDiscord(param.id);
  }

  @SetMetadata('permissions', ['manageMembers'])
  @UseGuards(CircleAuthGuard)
  @Patch('/:id/updateMemberRoles')
  async updateMemberRoles(
    @Param() param: ObjectIdDto,
    @Query() memberDto: MemberDto,
    @Body() updateMemberRolesDto: UpdateMemberRolesDto,
  ): Promise<DetailedCircleResponseDto> {
    return await this.circleMembershipService.updateMemberRoles(
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
    return await this.circleMembershipService.removeMember(
      param.id,
      memberDto.member,
    );
  }

  @UseGuards(SessionAuthGuard)
  @Patch('/:id/leave')
  async leave(@Param() param: ObjectIdDto): Promise<DetailedCircleResponseDto> {
    return await this.circleMembershipService.leave(param.id);
  }

  @SetMetadata('permissions', ['manageRoles'])
  @UseGuards(CircleAuthGuard)
  @Patch('/:id/addRole')
  async addRole(
    @Param() param: ObjectIdDto,
    @Body() addRoleDto: AddRoleDto,
  ): Promise<DetailedCircleResponseDto> {
    return await this.circleRoleServie.addRole(param.id, addRoleDto);
  }

  @SetMetadata('permissions', ['manageRoles'])
  @UseGuards(CircleAuthGuard)
  @Patch('/:id/updateRole')
  async updateRole(
    @Param() param: ObjectIdDto,
    @Query() roleParam: RequiredRoleDto,
    @Body() updateRoleDto: UpdateRoleDto,
  ): Promise<DetailedCircleResponseDto> {
    return await this.circleRoleServie.updateRole(
      param.id,
      roleParam.role,
      updateRoleDto,
    );
  }

  @SetMetadata('permissions', ['managePaymentOptions'])
  @UseGuards(CircleAuthGuard)
  @Patch('/:id/removeRole')
  async removeRole(
    @Param() param: ObjectIdDto,
    @Query() roleParam: RequiredRoleDto,
  ): Promise<DetailedCircleResponseDto> {
    return await this.circleRoleServie.removeRole(param.id, roleParam.role);
  }

  @SetMetadata('permissions', ['managePaymentOptions'])
  @UseGuards(CircleAuthGuard)
  @Patch('/:id/addSafe')
  async addSafe(
    @Param() param: ObjectIdDto,
    @Body() safeDto: SafeAddress,
  ): Promise<DetailedCircleResponseDto> {
    return await this.commandBus.execute(
      new AddSafeCommand(safeDto, null, param.id),
    );
  }

  @SetMetadata('permissions', ['managePaymentOptions'])
  @UseGuards(CircleAuthGuard)
  @Patch('/:id/removeSafe')
  async removeSafe(
    @Param() param: ObjectIdDto,
    @Body() safeDto: SafeAddress,
  ): Promise<DetailedCircleResponseDto> {
    return await this.commandBus.execute(
      new RemoveSafeCommand(safeDto, null, param.id),
    );
  }

  @SetMetadata('permissions', ['manageCircleSettings'])
  @UseGuards(CircleAuthGuard)
  @Patch('/:id/archive')
  async archive(
    @Param() param: ObjectIdDto,
  ): Promise<DetailedCircleResponseDto> {
    console.log('archive');
    return await this.commandBus.execute(
      new ArchiveCircleByIdCommand(param.id),
    );
  }

  @UseGuards(SessionAuthGuard)
  @Patch('/:id/claimCircle')
  async claimCircle(
    @Param() param: ObjectIdDto,
    @Request() request,
  ): Promise<DetailedCircleResponseDto> {
    return await this.commandBus.execute(
      new ClaimCircleCommand(param.id, request.user),
    );
  }
}
