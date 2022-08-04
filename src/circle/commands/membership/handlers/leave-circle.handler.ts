import { InternalServerErrorException } from '@nestjs/common';
import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CircleValidationService } from 'src/circle/circle-validation.service';
import { CirclesRepository } from 'src/circle/circles.repository';
import { RemoveFromCircleCommand } from 'src/circle/commands/impl';
import { DetailedCircleResponseDto } from 'src/circle/dto/detailed-circle-response.dto';

@CommandHandler(RemoveFromCircleCommand)
export class RemoveFromCircleCommandHandler
  implements ICommandHandler<RemoveFromCircleCommand>
{
  constructor(
    private readonly circlesRepository: CirclesRepository,
    private readonly commandBus: CommandBus,
    private readonly validationService: CircleValidationService,
  ) {}

  async execute(
    command: RemoveFromCircleCommand,
  ): Promise<DetailedCircleResponseDto> {
    try {
      const { id, userId, circle } = command;
      const circleToUpdate =
        circle || (await this.circlesRepository.findById(id));
      if (!circleToUpdate) {
        throw new InternalServerErrorException(
          `Could not find circle with id ${id}`,
        );
      }
      this.validationService.validateExistingMember(circleToUpdate, userId);
      delete circleToUpdate.memberRoles[userId];
      const updatedCircle =
        await this.circlesRepository.updateCircleAndReturnWithPopulatedReferences(
          id,
          {
            members: circleToUpdate.members.filter(
              (m) => m.toString() !== userId,
            ),
            memberRoles: circleToUpdate.memberRoles,
          },
        );
      return updatedCircle;
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }
}
