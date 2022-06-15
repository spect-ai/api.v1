import {
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { SlugService } from 'src/common/slug.service';
import { Invite } from 'src/common/types/invite.type';
import { UserProvider } from 'src/users/user.provider';
import { CirclesRepository } from './circles.repository';
import { CreateCircleRequestDto } from './dto/create-circle-request.dto';
import { DetailedCircleResponseDto } from './dto/detailed-circle-response.dto';
import { JoinCircleRequestDto } from './dto/join-circle.dto';
import { UpdateCircleRequestDto } from './dto/update-circle-request.dto';
import { Circle } from './model/circle.model';
import { DiscordService } from 'src/common/discord.service';
import { GithubService } from 'src/common/github.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class CirclesService {
  constructor(
    private readonly userProvider: UserProvider,
    private readonly circlesRepository: CirclesRepository,
    private readonly slugService: SlugService,
    private readonly discordService: DiscordService,
    private readonly githubService: GithubService,
  ) {}

  async getDetailedCircle(id: string): Promise<DetailedCircleResponseDto> {
    const circle =
      await this.circlesRepository.getCircleWithPopulatedReferences(id);
    return circle;
  }

  async getDetailedCircleBySlug(
    slug: string,
  ): Promise<DetailedCircleResponseDto> {
    const circle =
      await this.circlesRepository.getCircleWithPopulatedReferencesBySlug(slug);
    return circle;
  }

  async getPublicParentCircles(): Promise<Circle[]> {
    const circles = await this.circlesRepository.getPublicParentCircles();
    return circles;
  }

  async create(
    createCircleDto: CreateCircleRequestDto,
  ): Promise<DetailedCircleResponseDto> {
    try {
      const slug = await this.slugService.generateUniqueSlug(
        createCircleDto.name,
        this.circlesRepository,
      );
      const commitId = uuidv4();

      let parentCircle: Circle;
      if (createCircleDto.parent) {
        parentCircle =
          await this.circlesRepository.getCircleWithUnpopulatedReferences(
            createCircleDto.parent,
          );
      }
      let createdCircle: Circle;
      const memberRoles = {};
      console.log(this.userProvider.user);
      //memberRoles[this.userProvider.user.id] = ['admin'];
      if (parentCircle) {
        createdCircle = await this.circlesRepository.create({
          ...createCircleDto,
          slug: slug,
          parents: [parentCircle._id],
          //members: [this.userProvider.user._id],
          memberRoles: memberRoles,
        });
        await this.circlesRepository.updateById(parentCircle.id as string, {
          ...parentCircle,
          children: [...parentCircle.children, createdCircle],
        });
      } else {
        createdCircle = await this.circlesRepository.create({
          ...createCircleDto,
          slug: slug,
          //members: [this.userProvider.user._id],
          memberRoles: memberRoles,
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
    newInvite: Invite,
  ): Promise<DetailedCircleResponseDto> {
    try {
      const circle =
        await this.circlesRepository.getCircleWithUnpopulatedReferences(id);
      const invites = circle.invites;
      const updatedCircle = await this.circlesRepository.updateById(id, {
        invites: [...invites, newInvite],
      });
      return updatedCircle;
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
      if (joinCircleDto.joinUsing === 'discord') {
        const role = await this.discordService.getSpectRoleFromDiscordId(
          this.userProvider.user.discordId,
        );
        if (!role) {
          throw new HttpException(
            'Role required to join circle not found',
            HttpStatus.NOT_FOUND,
          );
        }
        const updatedCircle = await this.circlesRepository.updateById(id, {
          // members: [...circle.members, this.userProvider.user._id],
          // memberRoles: {...circle.memberRoles, [this.userProvider.user.id]: role},
        });
        return updatedCircle;
      } else if (joinCircleDto.joinUsing === 'invitation') {
        const invite = circle.invites.find(
          (invite) => invite.id === joinCircleDto.invitationId,
        );
        if (!invite) {
          throw new HttpException('Invitation not found', HttpStatus.NOT_FOUND);
        } else {
          const updatedCircle = await this.circlesRepository.updateById(id, {
            // members: [...circle.members, this.userProvider.user._id],
            // memberRoles: {...circle.memberRoles, [this.userProvider.user.id]: invite.role},
          });
          return updatedCircle;
        }
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
