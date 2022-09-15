import { InternalServerErrorException } from '@nestjs/common';
import {
  CommandBus,
  CommandHandler,
  ICommandHandler,
  QueryBus,
} from '@nestjs/cqrs';
import { Project } from 'src/project/model/project.model';
import { ProjectsRepository } from 'src/project/project.repository';
import { GetProjectByIdQuery } from 'src/project/queries/impl';
import { ImportTrelloCommand } from '../impl';
import fetch from 'node-fetch';
import { CreateCardCommand } from 'src/card/commands/impl';
import { GetCircleByIdQuery } from 'src/circle/queries/impl';
import { Circle } from 'src/circle/model/circle.model';

@CommandHandler(ImportTrelloCommand)
export class ImportTrelloCommandHandler
  implements ICommandHandler<ImportTrelloCommand>
{
  constructor(
    private readonly projectRepository: ProjectsRepository,
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
  ) {}

  async execute(command: ImportTrelloCommand): Promise<Project> {
    try {
      const { projectId, trelloId, callerId } = command;
      const projectToUpdate: Project = await this.projectRepository.findById(
        projectId,
      );

      const circle: Circle = await this.queryBus.execute(
        new GetCircleByIdQuery(projectToUpdate.parents[0]),
      );

      if (!projectToUpdate) {
        throw new InternalServerErrorException('Project not found');
      }
      const trelloLists = await (
        await fetch(`https://api.trello.com/1/boards/${trelloId}/lists`)
      ).json();

      const trelloCards = await (
        await fetch(`https://api.trello.com/1/boards/${trelloId}/cards`)
      ).json();

      const columnOrder = trelloLists.map((list) => list.id);
      const columnDetails = {};
      trelloLists.forEach((list) => {
        columnDetails[list.id] = {
          columnId: list.id,
          name: list.name,
          cards: [],
          defaultCardType: 'task',
        };
      });

      let updatedProject = await this.projectRepository.updateById(
        projectToUpdate.id,
        {
          columnOrder,
          columnDetails,
        },
      );

      const createAllCards = async () => {
        for (const card of trelloCards) {
          await this.commandBus.execute(
            new CreateCardCommand(
              {
                title: card.name,
                description: card.desc,
                columnId: card.idList,
                project: projectId,
                type: 'Task',
                circle: circle.id.toString(),
                deadline: card.due,
                labels: card.labels.map((label) => label.name),
              },
              projectToUpdate,
              circle,
              callerId,
              undefined,
            ),
          );
        }
      };

      await createAllCards();

      updatedProject = await this.queryBus.execute(
        new GetProjectByIdQuery(projectId),
      );

      return updatedProject;
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }
}
