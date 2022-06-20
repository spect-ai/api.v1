import {
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { SlugService } from 'src/common/slug.service';
import { InviteDto } from './dto/invite.dto';
import { RequestProvider } from 'src/users/user.provider';
import { CirclesRepository } from './circles.repository';
import { CreateCircleRequestDto } from './dto/create-circle-request.dto';
import { DetailedCircleResponseDto } from './dto/detailed-circle-response.dto';
import { JoinCircleRequestDto } from './dto/join-circle.dto';
import { UpdateCircleRequestDto } from './dto/update-circle-request.dto';
import { Circle } from './model/circle.model';
import { DiscordService } from 'src/common/discord.service';
import { GithubService } from 'src/common/github.service';
import { RolesService } from 'src/roles/roles.service';
import { v4 as uuidv4 } from 'uuid';
import moment from 'moment';
import { DataStructureManipulationService } from 'src/common/dataStructureManipulation.service';
import { ObjectId } from 'mongoose';
import { GetMemberDetailsOfCircleDto } from './dto/get-member-details.dto';
import { User } from 'src/users/model/users.model';

@Injectable()
export class CirclesService {
  constructor(
    private readonly requestProvider: RequestProvider,
    private readonly circlesRepository: CirclesRepository,
    private readonly slugService: SlugService,
    private readonly discordService: DiscordService,
    private readonly githubService: GithubService,
    private readonly roleService: RolesService,
    private readonly datastructureManipulationService: DataStructureManipulationService,
  ) {}

  async getCollatedUserPermissions(
    circleIds: string[],
    user: User,
  ): Promise<any> {
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
      const memberRoles = circle.memberRoles[user.id];
      if (memberRoles) {
        for (const memberRole of memberRoles) {
          userPermissions.push(circle.roles[memberRole].permissions);
        }
      }
    }
    return this.datastructureManipulationService.collateifyBooleanFields(
      userPermissions,
    );
  }

  async getMemberDetailsOfCircles(circleIds: string[]): Promise<any> {
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
    let res = this.datastructureManipulationService.arrayify(
      circles,
      'members',
    );
    res = this.datastructureManipulationService.distinctify(res, 'id');
    const memberDetails = this.datastructureManipulationService.objectify(
      res,
      'id',
    );
    return {
      memberDetails,
      members: Object.keys(memberDetails),
    };
  }

  async getCircleWithSlug(slug: string): Promise<DetailedCircleResponseDto> {
    const circle =
      await this.circlesRepository.getCircleWithPopulatedReferencesBySlug(slug);
    if (!circle) {
      throw new HttpException('Circle not found', HttpStatus.NOT_FOUND);
    }
    const res = {
      ...circle,
      memberDetails: this.datastructureManipulationService.objectify(
        circle.members,
        'id',
      ),
    };
    return res;
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
          members: [this.requestProvider.user._id],
          memberRoles: memberRoles,
          roles: this.roleService.defaultCircleRoles(),
        });
        await this.circlesRepository.updateById(parentCircle.id as string, {
          ...parentCircle,
          children: [...parentCircle.children, createdCircle],
        });
      } else {
        createdCircle = await this.circlesRepository.create({
          ...createCircleDto,
          slug: slug,
          members: [this.requestProvider.user._id],
          memberRoles: memberRoles,
          roles: this.roleService.defaultCircleRoles(),
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
      const updatedCircle = await this.circlesRepository.updateById(
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
        await this.circlesRepository.getCircleWithUnpopulatedReferences(id);
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

  async join(
    id: string,
    joinCircleDto: JoinCircleRequestDto,
  ): Promise<DetailedCircleResponseDto> {
    try {
      const circle =
        await this.circlesRepository.getCircleWithUnpopulatedReferences(id);
      if (circle.members.includes(this.requestProvider.user._id)) {
        throw new HttpException(
          'You are already a member of this circle',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
      if (joinCircleDto.joinUsing === 'discord') {
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
        const updatedCircle = await this.circlesRepository.updateById(id, {
          members: [...circle.members, this.requestProvider.user._id],
          memberRoles: {
            ...circle.memberRoles,
            [this.requestProvider.user.id]: role,
          },
        });
        return updatedCircle;
      } else if (joinCircleDto.joinUsing === 'invitation') {
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
        const updatedCircle = await this.circlesRepository.updateById(id, {
          members: [...circle.members, this.requestProvider.user._id],
          memberRoles: {
            ...circle.memberRoles,
            [this.requestProvider.user.id]: [invite.role],
          },
          invites: [...circle.invites, invite],
        });
        return updatedCircle;
      }
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed joining circle',
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
