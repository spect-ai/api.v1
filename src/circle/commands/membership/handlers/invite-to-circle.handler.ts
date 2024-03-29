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
      const invites = circleToUpdate.invites;
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
      throw new InternalServerErrorException(error);
    }
  }
}
