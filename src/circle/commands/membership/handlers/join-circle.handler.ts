import {
  HttpException,
  HttpStatus,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  CommandBus,
  CommandHandler,
  EventBus,
  ICommandHandler,
} from '@nestjs/cqrs';
import * as moment from 'moment';
import { CircleValidationService } from 'src/circle/circle-validation.service';
import { CirclesRepository } from 'src/circle/circles.repository';
import {
  JoinUsingDiscordCommand,
  JoinUsingInvitationCommand,
} from 'src/circle/commands/impl';
import { DetailedCircleResponseDto } from 'src/circle/dto/detailed-circle-response.dto';
import { JoinedCircleEvent } from 'src/circle/events/impl';
import { RolesService } from 'src/roles/roles.service';

@CommandHandler(JoinUsingInvitationCommand)
export class JoinUsingInvitationCommandHandler
  implements ICommandHandler<JoinUsingInvitationCommand>
{
  constructor(
    private readonly circlesRepository: CirclesRepository,
    private readonly eventBus: EventBus,
    private readonly validationService: CircleValidationService,
  ) {}

  async execute(
    command: JoinUsingInvitationCommand,
  ): Promise<DetailedCircleResponseDto> {
    try {
      const { id, joinCircleDto, caller } = command;
      const circle =
        await this.circlesRepository.getCircleWithUnpopulatedReferences(id);
      this.validationService.validateNewMember(circle, caller.id);

      const inviteIndex = circle.invites.findIndex(
        (invite) => invite.id === joinCircleDto.invitationId,
      );
      if (inviteIndex === -1) {
        throw new HttpException('Invitation not found', HttpStatus.NOT_FOUND);
      }

      const invite = circle.invites[inviteIndex];
      if (invite.uses <= 0 || moment().isAfter(invite.expires)) {
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
            members: [...circle.members, caller.id],
            memberRoles: {
              ...circle.memberRoles,
              [caller.id]: invite.roles,
            },
            invites: [...circle.invites, invite],
          },
        );

      this.eventBus.publish(
        new JoinedCircleEvent(caller.id, id, updatedCircle),
      );
      return updatedCircle;
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }
}

@CommandHandler(JoinUsingDiscordCommand)
export class JoinUsingDiscordCommandHandler
  implements ICommandHandler<JoinUsingDiscordCommand>
{
  constructor(
    private readonly circlesRepository: CirclesRepository,
    private readonly eventBus: EventBus,
    private readonly validationService: CircleValidationService,
    private readonly roleService: RolesService,
  ) {}

  async execute(
    command: JoinUsingDiscordCommand,
  ): Promise<DetailedCircleResponseDto> {
    try {
      const { id, caller } = command;
      const circle =
        await this.circlesRepository.getCircleWithUnpopulatedReferences(id);
      this.validationService.validateNewMember(circle, caller.id);
      const role = await this.roleService.getSpectRoleFromDiscord(
        caller,
        circle,
      );
      if (!role || role.length === 0) {
        throw new HttpException(
          'Role required to join circle not found',
          HttpStatus.NOT_FOUND,
        );
      }
      const updatedCircle =
        await this.circlesRepository.updateCircleAndReturnWithPopulatedReferences(
          id,
          {
            members: [...circle.members, caller.id],
            memberRoles: {
              ...circle.memberRoles,
              [caller.id]: role,
            },
          },
        );

      this.eventBus.publish(
        new JoinedCircleEvent(caller.id, id, updatedCircle),
      );
      return updatedCircle;
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }
}
