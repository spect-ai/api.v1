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
      const role = roleDto.name.toLowerCase().replace(/\s/g, '');
      let circleToUpdate = circle;
      if (!circleToUpdate) {
        circleToUpdate = await this.circlesRepository.findById(id);
      }
      if (!circleToUpdate) {
        throw new InternalServerErrorException('Circle not found');
      }
      if (circleToUpdate.roles[role]) {
        throw new InternalServerErrorException('Role already exists');
      }

      const roles = {
        ...circleToUpdate.roles,
        [role]: {
          ...roleDto,
          mutable: roleDto.mutable !== undefined ? roleDto.mutable : true,
        },
      };

      const updatedCircle =
        await this.circlesRepository.updateCircleAndReturnWithPopulatedReferences(
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
