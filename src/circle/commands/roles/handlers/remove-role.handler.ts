import { InternalServerErrorException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CirclesRepository } from 'src/circle/circles.repository';
import { Circle } from 'src/circle/model/circle.model';
import { RemoveRoleCommand } from '../impl/remove-role.command';

@CommandHandler(RemoveRoleCommand)
export class RemoveRoleCommandHandler
  implements ICommandHandler<RemoveRoleCommand>
{
  constructor(private readonly circlesRepository: CirclesRepository) {}

  async execute(command: RemoveRoleCommand): Promise<Circle> {
    try {
      const { circle, id, roleId } = command;
      let circleToUpdate = circle;
      if (!circleToUpdate) {
        circleToUpdate = await this.circlesRepository.findById(id);
      }
      if (!circleToUpdate) {
        throw new InternalServerErrorException('Circle not found');
      }
      if (!circleToUpdate.roles[roleId].mutable) {
        throw new InternalServerErrorException(
          'Role cannot be removed as its not mutable',
        );
      }

      delete circleToUpdate.roles[roleId];
      for (const [member, roles] of Object.entries(
        circleToUpdate.memberRoles,
      )) {
        circleToUpdate.memberRoles[member] = roles.filter(
          (role) => role !== roleId,
        );
      }

      const updatedCircle = await this.circlesRepository.updateById(
        circleToUpdate.id,
        {
          roles: circleToUpdate.roles,
          memberRoles: circleToUpdate.memberRoles,
        },
      );
      return updatedCircle;
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }
}
