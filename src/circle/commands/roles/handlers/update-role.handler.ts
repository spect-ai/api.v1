import { InternalServerErrorException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CirclesRepository } from 'src/circle/circles.repository';
import { Circle } from 'src/circle/model/circle.model';
import { UpdateRoleCommand } from '../impl/update-role.command';

@CommandHandler(UpdateRoleCommand)
export class UpdateRoleCommandHandler
  implements ICommandHandler<UpdateRoleCommand>
{
  constructor(private readonly circlesRepository: CirclesRepository) {}

  async execute(command: UpdateRoleCommand): Promise<Circle> {
    try {
      const { circle, id, roleId, roleDto } = command;
      let circleToUpdate = circle;
      if (!circleToUpdate) {
        circleToUpdate = await this.circlesRepository.findById(id);
      }
      if (!circleToUpdate) {
        throw new InternalServerErrorException('Circle not found');
      }
      if (roleId === 'applicant') {
        throw new InternalServerErrorException('Cannot update applicant role');
      }

      const roles = {
        ...circleToUpdate.roles,
        [roleId]: roleDto,
      };

      const updatedCircle = await this.circlesRepository.updateById(
        circleToUpdate.id,
        {
          roles,
        },
      );
      return updatedCircle;
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }
}