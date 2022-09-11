import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { CirclesRepository } from 'src/circle/circles.repository';
import { CommonTools } from 'src/common/common.service';
import { GlobalDocumentUpdate } from 'src/common/types/update.type';
import { LoggingService } from 'src/logging/logging.service';
import { ProjectsRepository } from 'src/project/project.repository';
import { RequestProvider } from 'src/users/user.provider';
import { CardsRepository } from '../cards.repository';
import { CreateGithubPRDto } from '../dto/work-request.dto';
import { WorkService } from '../work.cards.service';

@Injectable()
export class WorkCommandHandler {
  constructor(
    private readonly requestProvider: RequestProvider,
    private readonly projectRepository: ProjectsRepository,
    private readonly workService: WorkService,
    private readonly cardsRepository: CardsRepository,
    private readonly commonTool: CommonTools,
    private readonly eventBus: EventBus,
    private readonly circleRepository: CirclesRepository,
    private readonly logger: LoggingService,
  ) {
    logger.setContext('WorkCommandHandler');
  }

  async handleGithubPR(createGithubPRDto: CreateGithubPRDto): Promise<boolean> {
    try {
      const globalUpdate = {
        card: {},
        project: {},
      } as GlobalDocumentUpdate;
      /** Assumes all cards are from the same project */
      const cards = await this.cardsRepository.findAll({
        slug: { $in: createGithubPRDto.slugs },
      });

      const project = await this.projectRepository.findById(
        cards[0].project as string,
      );

      const objectifiedCards = this.commonTool.objectify(cards, 'id');
      const cardUpdates =
        await this.workService.createSameWorkThreadInMultipleCards(
          cards,
          createGithubPRDto,
        );

      // let globalUpdateAfterAutomation: GlobalDocumentUpdate = {
      //   card: {},
      //   project: {},
      // };
      // for (const [cardId, cardUpdate] of Object.entries(cardUpdates)) {
      //   const update = this.automationService.handleAutomation(
      //     objectifiedCards[cardId],
      //     project,
      //     cardUpdate,
      //     this.requestProvider.user.id,
      //   );

      //   globalUpdateAfterAutomation = {
      //     ...globalUpdateAfterAutomation,
      //     ...update,
      //   };
      // }
      // const updates = await this.commonTool.mergeObjects(
      //   globalUpdateAfterAutomation.card,
      //   cardUpdates,
      // );
      const acknowledgment = await this.cardsRepository.bundleUpdatesAndExecute(
        cardUpdates,
      );

      // const projectAcknowledgment =
      //   await this.projectRepository.bundleUpdatesAndExecute(
      //     globalUpdateAfterAutomation.project,
      //   );
      if (acknowledgment.hasWriteErrors()) {
        console.log(acknowledgment.getWriteErrors());
        throw new InternalServerErrorException('Failed creating work thread');
      }
      return true;
    } catch (error) {
      this.logger.logError(
        `Failed while creating work thread with github pr with error: ${error.message}`,
        this.requestProvider,
      );
      throw new InternalServerErrorException(
        'Failed creating work thread with github pr',
        error.message,
      );
    }
  }
}
