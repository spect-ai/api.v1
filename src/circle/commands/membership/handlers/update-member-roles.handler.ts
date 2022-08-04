import { InternalServerErrorException } from '@nestjs/common';
import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CircleValidationService } from 'src/circle/circle-validation.service';
import { CirclesRepository } from 'src/circle/circles.repository';
import { UpdateMemberRolesCommand } from 'src/circle/commands/impl';
import { DetailedCircleResponseDto } from 'src/circle/dto/detailed-circle-response.dto';

@CommandHandler(UpdateMemberRolesCommand)
export class UpdateMemberRolesCommandHandler
  implements ICommandHandler<UpdateMemberRolesCommand>
{
  constructor(
    private readonly circlesRepository: CirclesRepository,
    private readonly commandBus: CommandBus,
    private readonly validationService: CircleValidationService,
  ) {}

  async execute(
    command: UpdateMemberRolesCommand,
  ): Promise<DetailedCircleResponseDto> {
    try {
      const { id, userId, circle, updateMemberRolesDto } = command;
      const circleToUpdate =
        circle || (await this.circlesRepository.findById(id));
      this.validationService.validateExistingMember(circleToUpdate, userId);
      this.validationService.validateRolesExistInCircle(
        circleToUpdate,
        updateMemberRolesDto.roles,
      );

      const updatedCircle =
        await this.circlesRepository.updateCircleAndReturnWithPopulatedReferences(
          id,
          {
            memberRoles: {
              ...circleToUpdate.memberRoles,
              [userId]: updateMemberRolesDto.roles,
            },
          },
        );
      return updatedCircle;
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }
}
