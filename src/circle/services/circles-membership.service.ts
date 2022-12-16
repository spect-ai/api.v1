import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { CommandBus, EventBus } from '@nestjs/cqrs';
import { GuildxyzService } from 'src/common/guildxyz.service';
import { LoggingService } from 'src/logging/logging.service';
import { RolesService } from 'src/roles/roles.service';
import { RequestProvider } from 'src/users/user.provider';
import { CirclesRepository } from '../circles.repository';
import {
  InviteToCircleCommand,
  JoinUsingDiscordCommand,
  JoinUsingGuildxyzCommand,
  JoinUsingInvitationCommand,
  JoinWithoutInvitationCommand,
  RemoveFromCircleCommand,
  UpdateMemberRolesCommand,
} from '../commands/impl';
import { CircleResponseDto } from '../dto/detailed-circle-response.dto';
import { InviteDto } from '../dto/invite.dto';
import {
  JoinCircleUsingInvitationRequestDto,
  JoinMultipleCirclesUsingDiscordDto,
} from '../dto/join-circle.dto';
import { UpdateMemberRolesDto } from '../dto/update-member-role.dto';

@Injectable()
export class CircleMembershipService {
  constructor(
    private readonly requestProvider: RequestProvider,
    private readonly circlesRepository: CirclesRepository,
    private readonly commandBus: CommandBus,
    private readonly roleService: RolesService,
    private readonly guildService: GuildxyzService,
    private readonly logger: LoggingService,
    private readonly eventBus: EventBus,
  ) {
    logger.setContext('CircleMembershipService');
  }

  async invite(id: string, newInvite: InviteDto): Promise<string> {
    try {
      const inviteId = await this.commandBus.execute(
        new InviteToCircleCommand(newInvite, this.requestProvider.user, id),
      );
      return inviteId;
    } catch (error) {
      this.logger.logError(
        `Failed generating invite link with error: ${error.message}`,
        this.requestProvider,
      );
      throw new InternalServerErrorException(
        'Failed generating invite link',
        error.message,
      );
    }
  }

  async joinUsingInvitation(
    id: string,
    joinCircleDto: JoinCircleUsingInvitationRequestDto,
  ): Promise<CircleResponseDto> {
    try {
      const updatedCircle = await this.commandBus.execute(
        new JoinUsingInvitationCommand(
          id,
          joinCircleDto,
          this.requestProvider.user,
        ),
      );
      const circle = await this.circlesRepository.getCircleWithMinimalDetails(
        updatedCircle,
      );
      return circle;
    } catch (error) {
      this.logger.logError(
        `Failed joining circle using invite link with error: ${error.message}`,
        this.requestProvider,
      );
      throw new InternalServerErrorException(
        'Failed joining circle',
        error.message,
      );
    }
  }

  async joinUsingDiscord(id: string): Promise<CircleResponseDto> {
    try {
      const updatedCircle = await this.commandBus.execute(
        new JoinUsingDiscordCommand(id, this.requestProvider.user),
      );
      const circle = await this.circlesRepository.getCircleWithMinimalDetails(
        updatedCircle,
      );
      return circle;
    } catch (error) {
      this.logger.logError(
        `Failed joining circle using discord with error: ${error.message}`,
        this.requestProvider,
      );
      throw new InternalServerErrorException(
        'Failed joining circle',
        error.message,
      );
    }
  }

  async joinUsingGuildxyz(id: string): Promise<CircleResponseDto> {
    try {
      const updatedCircle = await this.commandBus.execute(
        new JoinUsingGuildxyzCommand(id, this.requestProvider.user),
      );
      const circle = await this.circlesRepository.getCircleWithMinimalDetails(
        updatedCircle,
      );
      return circle;
    } catch (error) {
      this.logger.logError(
        `Failed joining circle using guild with error: ${error.message}`,
        this.requestProvider,
      );
      throw new InternalServerErrorException(
        'Failed joining circle',
        error.message,
      );
    }
  }

  async joinMultipleCirclesUsingGuildxyz(id: string): Promise<void> {
    try {
      const memberships = await this.guildService.getGuildMemberships(id);
      const guildIds = memberships.map((guild) => guild.guildId);
      if (guildIds?.length == 0) return;
      const guildCircles = await this.circlesRepository.findAll({
        $and: [
          { guildxyzId: { $in: guildIds } },
          { members: { $nin: this.requestProvider.user.id } },
          { guildxyzToCircleRoles: { $exists: true } },
          { private: false },
        ],
      });

      if (guildCircles?.length == 0) return;
      for (const i in guildCircles) {
        const id = guildCircles?.[i]?.id;
        await this.commandBus.execute(
          new JoinUsingGuildxyzCommand(id, this.requestProvider.user),
        );
      }
    } catch (error) {
      this.logger.logError(
        `Failed joining Multiple circles using guild with error: ${error.message}`,
        this.requestProvider,
      );
      throw new InternalServerErrorException(
        'Failed joining Multiple circle using Guild',
        error.message,
      );
    }
  }

  async joinMultipleCirclesUsingDiscord(
    joinDto: JoinMultipleCirclesUsingDiscordDto,
  ): Promise<void> {
    try {
      const guildIds = joinDto.guildData.map((guild) => guild.id);
      if (guildIds?.length == 0) return;
      const guildCircles = await this.circlesRepository.findAll({
        $and: [
          { discordGuildId: { $in: guildIds } },
          { members: { $nin: this.requestProvider.user?.id } },
          { discordToCircleRoles: { $exists: true } },
          { private: false },
        ],
      });

      if (guildCircles?.length == 0) return;
      for (const i in guildCircles) {
        const id = guildCircles?.[i]?.id;
        await this.commandBus.execute(
          new JoinUsingDiscordCommand(id, this.requestProvider.user),
        );
      }
    } catch (error) {
      this.logger.logError(
        `Failed joining Multiple circles using Discord with error: ${error.message}`,
        this.requestProvider,
      );
      throw new InternalServerErrorException(
        'Failed joining Multiple circles using Discord',
        error.message,
      );
    }
  }

  async join(id: string): Promise<CircleResponseDto> {
    try {
      const updatedCircle = await this.commandBus.execute(
        new JoinWithoutInvitationCommand(id, this.requestProvider.user),
      );
      const circle = await this.circlesRepository.getCircleWithMinimalDetails(
        updatedCircle,
      );
      return circle;
    } catch (error) {
      this.logger.logError(
        `Failed joining circle with error: ${error.message}`,
        this.requestProvider,
      );
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
  ): Promise<CircleResponseDto> {
    try {
      const circle = await this.commandBus.execute(
        new UpdateMemberRolesCommand(
          updateMemberRolesDto,
          member,
          id,
          this.requestProvider.circle,
        ),
      );
      return await this.circlesRepository.getCircleWithMinimalDetails(circle);
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

  async removeMember(id: string, member: string): Promise<CircleResponseDto> {
    try {
      const updatedCircle = await this.commandBus.execute(
        new RemoveFromCircleCommand(member, id, this.requestProvider.circle),
      );
      return await this.circlesRepository.getCircleWithMinimalDetails(
        updatedCircle,
      );
    } catch (error) {
      this.logger.logError(
        `Failed removing member with error: ${error.message}`,
        this.requestProvider,
      );
      throw new InternalServerErrorException(
        'Failed removing member',
        error.message,
      );
    }
  }

  async leave(id: string): Promise<CircleResponseDto> {
    try {
      const updatedCircle = await this.commandBus.execute(
        new RemoveFromCircleCommand(
          this.requestProvider.user.id,
          id,
          this.requestProvider.circle,
        ),
      );
      return await this.circlesRepository.getCircleWithMinimalDetails(
        updatedCircle,
      );
    } catch (error) {
      this.logger.logError(
        `Failed leaving circle with error: ${error.message}`,
        this.requestProvider,
      );
      throw new InternalServerErrorException(
        'Failed leaving circle',
        error.message,
      );
    }
  }
}
