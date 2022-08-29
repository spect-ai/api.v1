import { InternalServerErrorException } from '@nestjs/common';
import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CardsProjectService } from 'src/project/cards.project.service';
import {
  UpdateProjectByIdCommand,
  UpdateProjectCardNumByIdCommand,
} from 'src/project/commands/impl';
import { DetailedProjectResponseDto } from 'src/project/dto/detailed-project-response.dto';
import { Project } from 'src/project/model/project.model';
import { ProjectsRepository } from 'src/project/project.repository';

@CommandHandler(UpdateProjectByIdCommand)
export class UpdateProjectByIdCommandHandler
  implements ICommandHandler<UpdateProjectByIdCommand>
{
  constructor(
    private readonly projectRepository: ProjectsRepository,
    private readonly cardsProjectService: CardsProjectService,
  ) {}

  async execute(
    command: UpdateProjectByIdCommand,
  ): Promise<DetailedProjectResponseDto> {
    try {
      const { id, updateProjectDto } = command;
      const updatedProject =
        await this.projectRepository.updateProjectAndReturnWithPopulatedReferences(
          id,
          updateProjectDto,
        );

      return this.cardsProjectService.projectPopulatedWithCardDetails(
        updatedProject,
      );
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }
}

@CommandHandler(UpdateProjectCardNumByIdCommand)
export class UpdateProjectCardNumByIdCommandHandler
  implements ICommandHandler<UpdateProjectCardNumByIdCommand>
{
  constructor(
    private readonly projectRepository: ProjectsRepository,
    private readonly cardsProjectService: CardsProjectService,
  ) {}

  async execute(command: UpdateProjectCardNumByIdCommand): Promise<Project> {
    try {
      const { id, lastCardCount } = command;
      const project = await this.projectRepository.findById(id);
      const updatedProject =
        await this.projectRepository.updateProjectAndReturnWithPopulatedReferences(
          id,
          {
            cardCount: lastCardCount || project.cardCount,
          },
        );

      return updatedProject;
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }
}
