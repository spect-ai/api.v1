import { InternalServerErrorException } from '@nestjs/common';
import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CircleValidationService } from 'src/circle/circle-validation.service';
import { CirclesRepository } from 'src/circle/circles.repository';
import { InviteToCircleCommand } from 'src/circle/commands/impl';
import { v4 as uuidv4 } from 'uuid';

@CommandHandler(InviteToCircleCommand)
export class InviteToCircleCommandHandler
  implements ICommandHandler<InviteToCircleCommand>
{
  constructor(
    private readonly circlesRepository: CirclesRepository,
    private readonly commandBus: CommandBus,
    private readonly validationService: CircleValidationService,
  ) {}

  async execute(command: InviteToCircleCommand): Promise<string> {
    try {
      const { id, circle, newInvite, caller } = command;
      const circleToUpdate =
        circle || (await this.circlesRepository.findById(id));
      if (!circleToUpdate) {
        throw new InternalServerErrorException(
          `Could not find circle with id ${id}`,
        );
      }

      const rolesRanking = Object.keys(circleToUpdate.roles);
      const callerRole = circleToUpdate.memberRoles[caller.id];
      const highestRole = rolesRanking
        .map((role) => {
          console.log({ role });
          if (callerRole.includes(role)) {
            console.log('includes');
            return role;
          }
        })
        .filter((role) => role)[0];
      const callerRoleIndex = rolesRanking.indexOf(highestRole);
      const inviteRoleIndex = rolesRanking.indexOf(newInvite.roles[0]);

      if (callerRoleIndex > inviteRoleIndex) {
        throw new InternalServerErrorException(
          `You can only invite someone with a same or lower role than you`,
        );
      }

      const invites = circleToUpdate.invites;
      const inviteId = uuidv4();
      await this.circlesRepository.updateById(id, {
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
      throw new InternalServerErrorException(error);
    }
  }
}
