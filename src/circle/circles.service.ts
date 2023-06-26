import {
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ObjectId } from 'mongoose';
import { CommonTools } from 'src/common/common.service';
import { DiscordService } from 'src/common/discord.service';
import { GithubService } from 'src/common/github.service';
import { SlugService } from 'src/common/slug.service';
import { CirclePermission } from 'src/common/types/role.type';
import { LoggingService } from 'src/logging/logging.service';
import { RegistryService } from 'src/registry/registry.service';
import { RolesService } from 'src/roles/roles.service';
import { RequestProvider } from 'src/users/user.provider';
import { CirclesRepository } from './circles.repository';
import { DetailedCircleResponseDto } from './dto/detailed-circle-response.dto';
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
    private readonly logger: LoggingService,
  ) {
    logger.setContext('CirclesService');
  }

  validateNewMember(circle: Circle, newMember: string) {
    const members = circle.members.map((m) => m.toString());
    if (members.includes(newMember)) {
      throw new HttpException(
        'You are already a member of this space',
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
      const memberRoles = circle.memberRoles && circle.memberRoles[userId];
      if (memberRoles) {
        for (const memberRole of memberRoles) {
          if (!['__removed__', '__left__'].includes(memberRole))
            userPermissions.push(circle.roles[memberRole].permissions);
        }
      }
    }

    const circlePermissions: CirclePermission =
      this.roleService.collatePermissions(userPermissions) as CirclePermission;
    return circlePermissions;
  }

  async getUserRolesInCircle(circleIds: string[], userId: string) {
    const circle = await this.circlesRepository.findOne(
      {
        _id: { $in: circleIds },
      },
      {
        projection: {
          memberRoles: 1,
        },
      },
    );
    return circle.memberRoles[userId];
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
      this.logger.logError(
        `Failed circle update with error: ${error.message}`,
        this.requestProvider,
      );

      throw new InternalServerErrorException(
        'Failed circle update',
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
      this.logger.logError(
        `Failed updating member roles with error: ${error.message}`,
        this.requestProvider,
      );
      throw new InternalServerErrorException(error.message);
    }
  }
}
