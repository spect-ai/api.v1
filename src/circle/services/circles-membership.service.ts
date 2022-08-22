import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { CommandBus, EventBus } from '@nestjs/cqrs';
import { LoggingService } from 'src/logging/logging.service';
import { RequestProvider } from 'src/users/user.provider';
import { CirclesRepository } from '../circles.repository';
import {
  InviteToCircleCommand,
  JoinUsingDiscordCommand,
  JoinUsingInvitationCommand,
  RemoveFromCircleCommand,
  UpdateMemberRolesCommand,
} from '../commands/impl';
import { DetailedCircleResponseDto } from '../dto/detailed-circle-response.dto';
import { InviteDto } from '../dto/invite.dto';
import { JoinCircleUsingInvitationRequestDto } from '../dto/join-circle.dto';
import { UpdateMemberRolesDto } from '../dto/update-member-role.dto';
import { JoinedCircleEvent, LeftCircleEvent } from '../events/impl';

@Injectable()
export class CircleMembershipService {
  constructor(
    private readonly requestProvider: RequestProvider,
    private readonly circlesRepository: CirclesRepository,
    private readonly commandBus: CommandBus,
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
  ): Promise<DetailedCircleResponseDto> {
    try {
      const updatedCircle = await this.commandBus.execute(
        new JoinUsingInvitationCommand(
          id,
          joinCircleDto,
          this.requestProvider.user,
        ),
      );
      return updatedCircle;
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

  async joinUsingDiscord(id: string): Promise<DetailedCircleResponseDto> {
    try {
      const updatedCircle = await this.commandBus.execute(
        new JoinUsingDiscordCommand(id, this.requestProvider.user),
      );
      return updatedCircle;
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

  async updateMemberRoles(
    id: string,
    member: string,
    updateMemberRolesDto: UpdateMemberRolesDto,
  ): Promise<DetailedCircleResponseDto> {
    try {
      const circle = await this.commandBus.execute(
        new UpdateMemberRolesCommand(
          updateMemberRolesDto,
          member,
          id,
          this.requestProvider.circle,
        ),
      );
      return circle;
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

  async removeMember(
    id: string,
    member: string,
  ): Promise<DetailedCircleResponseDto> {
    try {
      const updatedCircle = await this.commandBus.execute(
        new RemoveFromCircleCommand(member, id, this.requestProvider.circle),
      );
      return updatedCircle;
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

  async leave(id: string): Promise<DetailedCircleResponseDto> {
    try {
      const updatedCircle = await this.commandBus.execute(
        new RemoveFromCircleCommand(
          this.requestProvider.user.id,
          id,
          this.requestProvider.circle,
        ),
      );
      return updatedCircle;
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
