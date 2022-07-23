import {
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import moment from 'moment';
import { ObjectId } from 'mongoose';
import { CommonTools } from 'src/common/common.service';
import { DiscordService } from 'src/common/discord.service';
import { GithubService } from 'src/common/github.service';
import { SlugService } from 'src/common/slug.service';
import { CirclePermission } from 'src/common/types/role.type';
import { RegistryService } from 'src/registry/registry.service';
import { RolesService } from 'src/roles/roles.service';
import { RequestProvider } from 'src/users/user.provider';
import { v4 as uuidv4 } from 'uuid';
import { CirclesRepository } from './circles.repository';
import { CreateCircleRequestDto } from './dto/create-circle-request.dto';
import { DetailedCircleResponseDto } from './dto/detailed-circle-response.dto';
import { InviteDto } from './dto/invite.dto';
import { JoinCircleUsingInvitationRequestDto } from './dto/join-circle.dto';
import { UpdateCircleRequestDto } from './dto/update-circle-request.dto';
import { UpdateMemberRolesDto } from './dto/update-member-role.dto';
import { Circle } from './model/circle.model';

@Injectable()
export class CirclesService {
  constructor(
    private readonly requestProvider: RequestProvider,
    private readonly circlesRepository: CirclesRepository,
    private readonly slugService: SlugService,
    private readonly discordService: DiscordService,
    private readonly githubService: GithubService,
    private readonly roleService: RolesService,
    private readonly commonTools: CommonTools,
    private readonly registryService: RegistryService,
  ) {}

  validateNewMember(circle: Circle, newMember: string) {
    const members = circle.members.map((m) => m.toString());
    if (members.includes(newMember)) {
      throw new HttpException(
        'You are already a member of this circle',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  validateExistingMember(circle: Circle, member: string) {
    const members = circle.members.map((m) => m.toString());
    if (!members.includes(member)) {
      throw new HttpException(
        'Member doesnt exist in the circle',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  validateRolesExistInCircle(circle: Circle, roles: string[]) {
    const rolesAreSubset = roles.every((role) =>
      Object.keys(circle.roles).includes(role),
    );
    if (!rolesAreSubset) {
      throw new HttpException(
        'Roles are not a subset of existing roles in the circle',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getCollatedUserPermissions(
    circleIds: string[],
    userId: string,
  ): Promise<CirclePermission> {
    const circles = await this.circlesRepository.findAll(
      {
        _id: { $in: circleIds },
      },
      {
        projection: {
          roles: 1,
          memberRoles: 1,
        },
      },
    );

    const userPermissions = [];
    for (const circle of circles) {
      const memberRoles = circle.memberRoles[userId];
      if (memberRoles) {
        for (const memberRole of memberRoles) {
          userPermissions.push(circle.roles[memberRole].permissions);
        }
      }
    }

    const circlePermissions: CirclePermission =
      this.roleService.collatePermissions(userPermissions) as CirclePermission;
    return circlePermissions;
  }

  async getMemberDetailsOfCircles(
    circleIds: string[] | ObjectId[],
  ): Promise<any> {
    const circles = await this.circlesRepository
      .findAll(
        {
          _id: { $in: circleIds },
        },
        {
          projection: {
            members: 1,
          },
        },
      )
      .populate('members');
    let res = this.commonTools.arrayify(circles, 'members');
    res = this.commonTools.distinctify(res, 'id');
    const memberDetails = this.commonTools.objectify(res, 'id');
    return {
      memberDetails,
      members: Object.keys(memberDetails),
    };
  }

  async getMemberDetailsOfCirclesWithSlug(slugs: string[]): Promise<any> {
    const circles = await this.circlesRepository
      .findAll(
        {
          slug: { $in: slugs },
        },
        {
          projection: {
            members: 1,
          },
        },
      )
      .populate('members');
    let res = this.commonTools.arrayify(circles, 'members');
    res = this.commonTools.distinctify(res, 'id');
    const memberDetails = this.commonTools.objectify(res, 'id');
    return {
      memberDetails,
      members: Object.keys(memberDetails),
    };
  }

  async getCircleWithSlug(slug: string): Promise<DetailedCircleResponseDto> {
    return await this.circlesRepository.getCircleWithPopulatedReferencesBySlug(
      slug,
    );
  }

  async create(
    createCircleDto: CreateCircleRequestDto,
  ): Promise<DetailedCircleResponseDto> {
    try {
      const slug = await this.slugService.generateUniqueSlug(
        createCircleDto.name,
        this.circlesRepository,
      );

      let parentCircle: Circle;
      if (createCircleDto.parent) {
        parentCircle =
          await this.circlesRepository.getCircleWithUnpopulatedReferences(
            createCircleDto.parent,
          );
      }
      let createdCircle: Circle;
      const memberRoles = {};
      memberRoles[this.requestProvider.user.id] = [
        this.roleService.getDefaultUserRoleOnCircleCreation(),
      ];
      if (parentCircle) {
        createdCircle = await this.circlesRepository.create({
          ...createCircleDto,
          slug: slug,
          parents: [parentCircle._id],
          members: [this.requestProvider.user.id],
          memberRoles: memberRoles,
          roles: this.roleService.defaultCircleRoles(),
          localRegistry: {},
        });
        await this.circlesRepository.updateById(parentCircle.id as string, {
          ...parentCircle,
          children: [...parentCircle.children, createdCircle],
        });
      } else {
        createdCircle = await this.circlesRepository.create({
          ...createCircleDto,
          slug: slug,
          members: [this.requestProvider.user.id],
          memberRoles: memberRoles,
          roles: this.roleService.defaultCircleRoles(),
          localRegistry: {},
        });
      }

      return createdCircle;
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed circle creation',
        error.message,
      );
    }
  }

  async update(
    id: string,
    updateCircleDto: UpdateCircleRequestDto,
  ): Promise<DetailedCircleResponseDto> {
    try {
      const updatedCircle =
        await this.circlesRepository.updateCircleAndReturnWithPopulatedReferences(
          id,
          updateCircleDto,
        );

      return updatedCircle;
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed circle update',
        error.message,
      );
    }
  }

  async invite(
    id: string,
    newInvite: InviteDto,
  ): Promise<DetailedCircleResponseDto> {
    try {
      const circle =
        this.requestProvider.circle ||
        (await this.circlesRepository.findById(id));
      const invites = circle.invites;
      const inviteId = uuidv4();
      const updatedCircle = await this.circlesRepository.updateById(id, {
        invites: [
          ...invites,
          {
            ...newInvite,
            id: inviteId,
            expires: new Date(newInvite.expires),
          },
        ],
      });
      return inviteId;
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed circle update',
        error.message,
      );
    }
  }

  async joinUsingInvitation(
    id: string,
    joinCircleDto: JoinCircleUsingInvitationRequestDto,
  ): Promise<DetailedCircleResponseDto> {
    try {
      const circle =
        await this.circlesRepository.getCircleWithUnpopulatedReferences(id);
      this.validateNewMember(circle, this.requestProvider.user.id);

      const inviteIndex = circle.invites.findIndex(
        (invite) => invite.id === joinCircleDto.invitationId,
      );
      if (inviteIndex === -1) {
        throw new HttpException('Invitation not found', HttpStatus.NOT_FOUND);
      }

      const invite = circle.invites[inviteIndex];
      if (invite.uses <= 0 && moment(new Date()).isAfter(invite.expires)) {
        throw new HttpException(
          'Invalid invitation - expired or used up already',
          HttpStatus.NOT_FOUND,
        );
      }

      circle.invites.splice(inviteIndex, 1);
      invite.uses--;
      const updatedCircle =
        await this.circlesRepository.updateCircleAndReturnWithPopulatedReferences(
          id,
          {
            members: [...circle.members, this.requestProvider.user._id],
            memberRoles: {
              ...circle.memberRoles,
              [this.requestProvider.user.id]: invite.roles,
            },
            invites: [...circle.invites, invite],
          },
        );
      return updatedCircle;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(
        'Failed joining circle',
        error.message,
      );
    }
  }

  async joinUsingDiscord(id: string): Promise<DetailedCircleResponseDto> {
    try {
      const circle =
        await this.circlesRepository.getCircleWithUnpopulatedReferences(id);
      this.validateNewMember(circle, this.requestProvider.user.id);
      const role = await this.roleService.getSpectRoleFromDiscord(
        this.requestProvider.user,
        circle,
      );
      if (!role) {
        throw new HttpException(
          'Role required to join circle not found',
          HttpStatus.NOT_FOUND,
        );
      }
      const updatedCircle =
        await this.circlesRepository.updateCircleAndReturnWithPopulatedReferences(
          id,
          {
            members: [...circle.members, this.requestProvider.user._id],
            memberRoles: {
              ...circle.memberRoles,
              [this.requestProvider.user.id]: role,
            },
          },
        );
      return updatedCircle;
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed joining circle',
        error.message,
      );
    }
  }

  async updateMemberRoles(
    id: string,
    member: string,
    updateMemberRolesDto: UpdateMemberRolesDto,
  ): Promise<DetailedCircleResponseDto> {
    try {
      const circle =
        this.requestProvider.circle ||
        (await this.circlesRepository.findById(id));
      this.validateExistingMember(circle, member);
      this.validateRolesExistInCircle(circle, updateMemberRolesDto.roles);

      const updatedCircle =
        await this.circlesRepository.updateCircleAndReturnWithPopulatedReferences(
          id,
          {
            memberRoles: {
              ...circle.memberRoles,
              [member]: updateMemberRolesDto.roles,
            },
          },
        );
      return updatedCircle;
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed updating member roles',
        error.message,
      );
    }
  }

  async removeMember(
    id: string,
    member: string,
  ): Promise<DetailedCircleResponseDto> {
    try {
      const circle =
        this.requestProvider.circle ||
        (await this.circlesRepository.findById(id));
      this.validateExistingMember(circle, member);
      delete circle.memberRoles[member];
      const updatedCircle =
        await this.circlesRepository.updateCircleAndReturnWithPopulatedReferences(
          id,
          {
            members: circle.members.filter((m) => m.toString() !== member),
            memberRoles: circle.memberRoles,
          },
        );
      return updatedCircle;
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed removing member',
        error.message,
      );
    }
  }

  async delete(id: string): Promise<Circle> {
    const circle = await this.circlesRepository.findById(id);
    if (!circle) {
      throw new HttpException('Circle not found', HttpStatus.NOT_FOUND);
    }
    return await this.circlesRepository.deleteById(id);
  }
}
