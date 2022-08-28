import { Injectable } from '@nestjs/common';
import { CommonTools } from 'src/common/common.service';
import { MappedPartialItem } from 'src/common/interfaces';
import { Project } from 'src/project/model/project.model';
import { ProjectsRepository } from 'src/project/project.repository';
import { CardsRepository } from '../cards.repository';
import { Card } from '../model/card.model';
import { ResponseBuilder } from './response.service';

@Injectable()
export class CommonUpdateService {
  constructor(
    private readonly responseBuilder: ResponseBuilder,
    private readonly cardsRepository: CardsRepository,
    private readonly projectRepository: ProjectsRepository,
    private readonly commonTools: CommonTools,
  ) {}

  async execute(
    updatedCard: MappedPartialItem<Card>,
    updatedProject?: MappedPartialItem<Project>,
  ) {
    await this.cardsRepository.bundleUpdatesAndExecute(updatedCard);
    if (updatedProject)
      await this.projectRepository.bundleUpdatesAndExecute(updatedProject);
  }

  async executeAndReturn(
    cardId: string,
    updatedCard: MappedPartialItem<Card>,
    updatedProject?: MappedPartialItem<Project>,
  ) {
    await this.execute(updatedCard, updatedProject);
    const resultingCard =
      await this.cardsRepository.getCardWithPopulatedReferences(cardId);
    return this.responseBuilder.enrichResponse(resultingCard);
  }
}
