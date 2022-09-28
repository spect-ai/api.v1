import {
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import moment from 'moment';
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
import { v4 as uuidv4 } from 'uuid';
import { CirclesRepository } from './circles.repository';
import { CreateCircleRequestDto } from './dto/create-circle-request.dto';
import { DetailedCircleResponseDto } from './dto/detailed-circle-response.dto';
import {
  CreateFolderDto,
  UpdateFolderDto,
  UpdateFolderOrderDto,
} from './dto/folder.dto';
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
    private readonly logger: LoggingService,
  ) {
    logger.setContext('CirclesService');
  }

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
      const memberRoles = circle.memberRoles && circle.memberRoles[userId];
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
      throw new InternalServerErrorException(
        'Failed updating member roles',
        error.message,
      );
    }
  }

  async addFolder(
    circleId: string,
    createFolderDto: CreateFolderDto,
  ): Promise<DetailedCircleResponseDto> {
    try {
      const circle =
        this.requestProvider.circle ||
        (await this.circlesRepository.findById(circleId));
      const folderOrder = circle.folderOrder || [];
      const folderDetails = circle.folderDetails || {};
      const newFolderId = uuidv4();
      const newFolder = {
        ...createFolderDto,
        id: newFolderId,
      };
      const newFolderDetails = {
        ...folderDetails,
        [newFolderId]: newFolder,
      };
      const newFolderOrder = [...folderOrder, newFolderId];
      const updatedCircle =
        await this.circlesRepository.updateCircleAndReturnWithPopulatedReferences(
          circleId,
          {
            folderDetails: newFolderDetails,
            folderOrder: newFolderOrder,
          },
        );
      return updatedCircle;
    } catch (error) {
      this.logger.logError(
        `Failed folder addition with error: ${error.message}`,
        this.requestProvider,
      );
      throw new InternalServerErrorException(
        'Failed folder addition',
        error.message,
      );
    }
  }

  async updateFolder(
    circleId: string,
    folderId: string,
    updateFolderDto: UpdateFolderDto,
  ): Promise<DetailedCircleResponseDto> {
    try {
      const circle =
        this.requestProvider.circle ||
        (await this.circlesRepository.findById(circleId));

      if (!circle.folderDetails[folderId]) {
        throw new HttpException('Folder not found', HttpStatus.NOT_FOUND);
      }
      const folderDetails = circle.folderDetails;
      folderDetails[folderId] = {
        ...folderDetails[folderId],
        ...updateFolderDto,
      };

      const updatedCircle =
        await this.circlesRepository.updateCircleAndReturnWithPopulatedReferences(
          circleId,
          {
            folderDetails,
          },
        );
      return updatedCircle;
    } catch (error) {
      this.logger.logError(
        `Failed folder updation with error: ${error.message}`,
        this.requestProvider,
      );
      throw new InternalServerErrorException(
        'Failed to update folder',
        error.message,
      );
    }
  }

  async updateFolderOrder(
    circleId: string,
    updatefolderOrder: UpdateFolderOrderDto,
  ): Promise<DetailedCircleResponseDto> {
    try {
      const folderOrder = updatefolderOrder.folderOrder;
      const updatedCircle =
        await this.circlesRepository.updateCircleAndReturnWithPopulatedReferences(
          circleId,
          {
            folderOrder,
          },
        );
      return updatedCircle;
    } catch (error) {
      this.logger.logError(
        `Failed to reorder folders with error: ${error.message}`,
        this.requestProvider,
      );
      throw new InternalServerErrorException(
        'Failed folder reorder',
        error.message,
      );
    }
  }

  async deleteFolder(
    circleId: string,
    folderId: string,
  ): Promise<DetailedCircleResponseDto> {
    try {
      const circle =
        this.requestProvider.circle ||
        (await this.circlesRepository.findById(circleId));

      if (!circle.folderDetails[folderId]) {
        throw new HttpException('Folder not found', HttpStatus.NOT_FOUND);
      }
      const folderDetails = circle.folderDetails;
      const folderOrder = circle.folderOrder;
      const folderIndex = circle.folderOrder.indexOf(folderId, 0);
      if (folderIndex > -1) {
        folderOrder.splice(folderIndex, 1);
      }
      if (folderId in folderDetails) {
        delete folderDetails[folderId];
      }

      const updatedCircle =
        await this.circlesRepository.updateCircleAndReturnWithPopulatedReferences(
          circleId,
          {
            folderDetails,
            folderOrder,
          },
        );
      return updatedCircle;
    } catch (error) {
      this.logger.logError(
        `Failed folder deletion with error: ${error.message}`,
        this.requestProvider,
      );
      throw new InternalServerErrorException(
        'Failed folder deletion',
        error.message,
      );
    }
  }
}
