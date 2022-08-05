import { InternalServerErrorException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CirclesRepository } from 'src/circle/circles.repository';
import { Circle } from 'src/circle/model/circle.model';
import {
  RemoveProjectsCommand,
  RemoveProjectsFromMultipleCirclesCommand,
} from '../impl/remove-projects.command';

@CommandHandler(RemoveProjectsCommand)
export class RemoveProjectsCommandHandler
  implements ICommandHandler<RemoveProjectsCommand>
{
  constructor(private readonly circlesRepository: CirclesRepository) {}

  async execute(command: RemoveProjectsCommand): Promise<Circle> {
    try {
      const { circle, id, projectIds } = command;
      let circleToUpdate = circle;
      if (!circleToUpdate) {
        circleToUpdate = await this.circlesRepository.findById(id);
      }
      if (!circleToUpdate) {
        throw new InternalServerErrorException('Circle not found');
      }

      const projects = circleToUpdate.projects.filter(
        (projectId) => !projectIds.includes(projectId.toString()),
      );

      const updatedCircle = await this.circlesRepository.updateById(
        circleToUpdate.id,
        {
          projects,
        },
      );
      return updatedCircle;
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }
}

@CommandHandler(RemoveProjectsFromMultipleCirclesCommand)
export class RemoveProjectsFromMultipleCirclesCommandHandler
  implements ICommandHandler<RemoveProjectsFromMultipleCirclesCommand>
{
  constructor(private readonly circlesRepository: CirclesRepository) {}

  async execute(
    command: RemoveProjectsFromMultipleCirclesCommand,
  ): Promise<boolean> {
    try {
      const { circles, ids, projectIds } = command;
      let circlesToUpdate = circles;
      if (!circlesToUpdate) {
        circlesToUpdate = await this.circlesRepository.findAll({
          _id: { $in: ids },
        });
      }
      if (!circlesToUpdate) {
        throw new InternalServerErrorException('Circles not found');
      }

      for (const circleToUpdate of circlesToUpdate) {
        const projects = circleToUpdate.projects.filter(
          (projectId) => !projectIds.includes(projectId.toString()),
        );

        await this.circlesRepository.updateById(circleToUpdate.id, {
          projects,
        });
      }

      return true;
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }
}
