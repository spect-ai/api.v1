import { InternalServerErrorException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CirclesRepository } from 'src/circle/circles.repository';
import { Circle } from 'src/circle/model/circle.model';
import { AddRoleCommand } from '../impl/add-role.command';

@CommandHandler(AddRoleCommand)
export class AddRoleCommandHandler implements ICommandHandler<AddRoleCommand> {
  constructor(private readonly circlesRepository: CirclesRepository) {}

  async execute(command: AddRoleCommand): Promise<Circle> {
    try {
      const { circle, id, roleDto } = command;
      let circleToUpdate = circle;
      if (!circleToUpdate) {
        circleToUpdate = await this.circlesRepository.findById(id);
      }
      if (!circleToUpdate) {
        throw new InternalServerErrorException('Circle not found');
      }
      if (circleToUpdate.roles[roleDto.role]) {
        throw new InternalServerErrorException('Role already exists');
      }
      console.log(roleDto);

      const roles = {
        ...circleToUpdate.roles,
        [roleDto.role]: roleDto,
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
