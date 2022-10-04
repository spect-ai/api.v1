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
import {
  CircleAuthGuard,
  CreateCircleAuthGuard,
  ViewCircleAuthGuard,
} from 'src/auth/circle.guard';
import {
  PublicViewAuthGuard,
  SessionAuthGuard,
} from 'src/auth/iron-session.guard';
import { ClaimKudosDto, MintKudosDto } from 'src/common/dtos/mint-kudos.dto';
import { ObjectIdDto } from 'src/common/dtos/object-id.dto';
import { RequiredRoleDto, RequiredSlugDto } from 'src/common/dtos/string.dto';
import { MintKudosService, nftTypes } from 'src/common/mint-kudos.service';
import {
  ArchiveCircleByIdCommand,
  ClaimCircleCommand,
  CreateFolderCommand,
  DeleteFolderCommand,
  UpdateFolderCommand,
  UpdateFolderOrderCommand,
  UpdateFolderDetailsCommand,
} from './commands/impl';
import { WhitelistMemberAddressCommand } from './commands/roles/impl/whitelist-member-address.command';
import { AddSafeCommand, RemoveSafeCommand } from './commands/safe/impl';
import { CreateCircleRequestDto } from './dto/create-circle-request.dto';
import {
  BucketizedCircleResponseDto,
  DetailedCircleResponseDto,
} from './dto/detailed-circle-response.dto';
import { InviteDto } from './dto/invite.dto';
import { JoinCircleUsingInvitationRequestDto } from './dto/join-circle.dto';
import { MemberDto } from './dto/params.dto';
import { AddRoleDto, UpdateRoleDto } from './dto/roles-requests.dto';
import { SafeAddress } from './dto/safe-request.dto';
import {
  AddWhitelistedAddressRequestDto,
  UpdateCircleRequestDto,
} from './dto/update-circle-request.dto';
import { UpdateMemberRolesDto } from './dto/update-member-role.dto';
import { Circle } from './model/circle.model';
import {
  GetCircleBySlugQuery,
  GetCircleNavigationBreadcrumbsQuery,
  GetCircleNavigationQuery,
} from './queries/impl';
import { CirclesRolesService } from './services/circle-roles.service';
import { CirclesCrudService } from './services/circles-crud.service';
import { CircleMembershipService } from './services/circles-membership.service';
import {
  CreateFolderDto,
  UpdateFolderDto,
  FolderParamDto,
  UpdateFolderOrderDto,
  UpdateFolderDetailsDto,
  CircleResponseDto,
} from './dto/folder.dto';

@Controller('circle/v1')
export class CircleV1Controller {
  constructor(
    private readonly circleMembershipService: CircleMembershipService,
    private readonly circleCrudService: CirclesCrudService,
    private readonly circleRoleServie: CirclesRolesService,
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
    private readonly kudosService: MintKudosService,
  ) {}

  @UseGuards(PublicViewAuthGuard)
  @Get('/allPublicParents')
  async findAllParentCircles(): Promise<BucketizedCircleResponseDto> {
    try {
      return await this.circleCrudService.getPubicParentCircles();
    } catch (error) {
      console.log(error);
      return {};
    }
  }

  @UseGuards(PublicViewAuthGuard)
  @Get('/:id')
  async findByObjectId(
    @Param() param: ObjectIdDto,
  ): Promise<DetailedCircleResponseDto> {
    return await this.circleCrudService.getById(param.id);
  }

  @UseGuards(PublicViewAuthGuard)
  @Get('/slug/:slug')
  async findBySlug(
    @Param() param: RequiredSlugDto,
  ): Promise<CircleResponseDto> {
    return await this.queryBus.execute(new GetCircleBySlugQuery(param.slug));
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

  @UseGuards(SessionAuthGuard)
  @Patch('/:id/joinUsingGuildxyz')
  async joinUsingGuildxyz(
    @Param() param: ObjectIdDto,
  ): Promise<DetailedCircleResponseDto> {
    return await this.circleMembershipService.joinUsingGuildxyz(param.id);
  }

  @UseGuards(SessionAuthGuard)
  @Patch('/:id/join')
  async join(@Param() param: ObjectIdDto): Promise<DetailedCircleResponseDto> {
    return await this.circleMembershipService.join(param.id);
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

  @SetMetadata('permissions', ['manageCircleSettings'])
  @UseGuards(CircleAuthGuard)
  @Patch('/:id/folder/add')
  async createFolder(
    @Param() param: ObjectIdDto,
    @Body() addFolderDto: CreateFolderDto,
  ): Promise<CircleResponseDto> {
    return await this.commandBus.execute(
      new CreateFolderCommand(param.id, addFolderDto),
    );
  }

  @SetMetadata('permissions', ['manageCircleSettings'])
  @UseGuards(CircleAuthGuard)
  @Patch('/:id/folder/:folderId/update')
  async updateFolder(
    @Param() param: ObjectIdDto,
    @Param() folderParam: FolderParamDto,
    @Body() updateFolderDto: UpdateFolderDto,
  ): Promise<CircleResponseDto> {
    return await this.commandBus.execute(
      new UpdateFolderCommand(param.id, folderParam.folderId, updateFolderDto),
    );
  }

  @SetMetadata('permissions', ['manageCircleSettings'])
  @UseGuards(CircleAuthGuard)
  @Patch('/:id/folderDetails')
  async updateFolderDetails(
    @Param() param: ObjectIdDto,
    @Body() updateFolderDetailsDto: UpdateFolderDetailsDto,
  ): Promise<CircleResponseDto> {
    return await this.commandBus.execute(
      new UpdateFolderDetailsCommand(param.id, updateFolderDetailsDto),
    );
  }

  @SetMetadata('permissions', ['manageCircleSettings'])
  @UseGuards(CircleAuthGuard)
  @Patch('/:id/folderOrder')
  async updateFolderOrder(
    @Param() param: ObjectIdDto,
    @Body() updateFolderOrderDto: UpdateFolderOrderDto,
  ): Promise<CircleResponseDto> {
    return await this.commandBus.execute(
      new UpdateFolderOrderCommand(param.id, updateFolderOrderDto),
    );
  }

  @SetMetadata('permissions', ['manageCircleSettings'])
  @UseGuards(CircleAuthGuard)
  @Patch('/:id/folder/:folderId/delete')
  async deleteFolder(
    @Param() param: ObjectIdDto,
    @Param() folderParam: FolderParamDto,
  ): Promise<CircleResponseDto> {
    return await this.commandBus.execute(
      new DeleteFolderCommand(param.id, folderParam.folderId),
    );
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

  @Get('/:id/circleNav')
  async circleNav(
    @Param() param: ObjectIdDto,
  ): Promise<DetailedCircleResponseDto> {
    return await this.queryBus.execute(new GetCircleNavigationQuery(param.id));
  }

  @Get('/:id/circleNavBreadcrumbs')
  async circleNavBreadcumbs(
    @Param() param: ObjectIdDto,
  ): Promise<DetailedCircleResponseDto> {
    return await this.queryBus.execute(
      new GetCircleNavigationBreadcrumbsQuery(param.id),
    );
  }

  @SetMetadata('permissions', ['distributeCredentials'])
  @UseGuards(CircleAuthGuard)
  @Patch('/:id/mintKudos')
  async mintKudos(
    @Param() param: ObjectIdDto,
    @Body() mintKudosDto: MintKudosDto,
  ): Promise<object> {
    return {
      operationId: await this.kudosService.mintKudos(param.id, mintKudosDto),
    };
  }

  @Patch('/:id/claimKudos')
  async claimKudos(
    @Param() param: ObjectIdDto,
    @Body() claimKudosDto: ClaimKudosDto,
  ): Promise<object> {
    return {
      operationId: await this.kudosService.claimKudos(param.id, claimKudosDto),
    };
  }

  @Get('/:id/communityKudosDesigns')
  async communityKudosDesigns(@Param() param: ObjectIdDto): Promise<nftTypes> {
    return await this.kudosService.getCommunityKudosDesigns(param.id);
  }

  @SetMetadata('permissions', ['manageMembers', 'manageRoles'])
  @Patch('/:id/addWhitelistedAddress')
  async addWhitelistedAddress(
    @Param() param: ObjectIdDto,
    @Body() addWhitelistedAddressDto: AddWhitelistedAddressRequestDto,
  ): Promise<Circle> {
    return await this.commandBus.execute(
      new WhitelistMemberAddressCommand(
        addWhitelistedAddressDto.ethAddress,
        addWhitelistedAddressDto.roles,
        null,
        param.id,
      ),
    );
  }
}
