import { InternalServerErrorException } from '@nestjs/common';
import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CircleValidationService } from 'src/circle/circle-validation.service';
import { CirclesRepository } from 'src/circle/circles.repository';
import { UpdateMemberRolesCommand } from 'src/circle/commands/impl';
import { DetailedCircleResponseDto } from 'src/circle/dto/detailed-circle-response.dto';
import { roleWithNoPermission } from 'src/constants';

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
      const { id, userId, circle, updateMemberRolesDto, skipMutabilityCheck } =
        command;
      const circleToUpdate =
        circle || (await this.circlesRepository.findById(id));
      this.validationService.validateExistingMember(circleToUpdate, userId);
      this.validationService.validateRolesExistInCircle(
        circleToUpdate,
        updateMemberRolesDto.roles,
      );
      if (!skipMutabilityCheck)
        this.validationService.validateRolesAreMutable(
          circleToUpdate,
          updateMemberRolesDto.roles,
        );

      const currRoles = Object.keys(circle.roles);
      const updatedRoles = circle.roles;
      if (
        updateMemberRolesDto.roles.includes('__removed__') ||
        updateMemberRolesDto.roles.includes('__left__')
      ) {
        if (!currRoles?.includes('__removed__')) {
          updatedRoles['__removed__'] = roleWithNoPermission('__removed__');
        }
        if (!currRoles?.includes('__left__')) {
          updatedRoles['__left__'] = roleWithNoPermission('__left__');
        }
      }

      const updatedCircle =
        await this.circlesRepository.updateCircleAndReturnWithPopulatedReferences(
          id,
          {
            memberRoles: {
              ...circleToUpdate.memberRoles,
              [userId]: updateMemberRolesDto.roles,
            },
            roles: updatedRoles,
          },
        );
      return updatedCircle;
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }
}
