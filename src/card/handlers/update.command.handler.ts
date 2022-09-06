import {
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { AutomationService } from 'src/automation/automation.service';
import { CirclesRepository } from 'src/circle/circles.repository';
import { CommonTools } from 'src/common/common.service';
import { GlobalDocumentUpdate } from 'src/common/types/update.type';
import { CardsProjectService } from 'src/project/cards.project.service';
import { DetailedProjectResponseDto } from 'src/project/dto/detailed-project-response.dto';
import { ReorderCardReqestDto } from 'src/project/dto/reorder-card-request.dto';
import { ProjectsRepository } from 'src/project/project.repository';
import { ProjectService } from 'src/project/project.service';
import { MappedProject } from 'src/project/types/types';
import { RequestProvider } from 'src/users/user.provider';
import { UsersRepository } from 'src/users/users.repository';
import { UsersService } from 'src/users/users.service';
import { ActivityBuilder } from '../activity.builder';
import { CardsRepository } from '../cards.repository';
import { CardsService } from '../cards.service';
import { DetailedCardResponseDto } from '../dto/detailed-card-response-dto';
import {
  MultiCardCloseDto,
  MultiCardCloseWithSlugDto,
  UpdateCardRequestDto,
} from '../dto/update-card-request.dto';
import { UpdatePaymentInfoDto } from '../dto/update-payment-info.dto';
import { CardUpdatedEvent } from '../events/impl';
import { CardsPaymentService } from '../payment.cards.service';
import { ResponseBuilder } from '../response.builder';
import { MappedCard, MappedDiff } from '../types/types';
import { CardValidationService } from '../validation.cards.service';
import { LoggingService } from 'src/logging/logging.service';

@Injectable()
export class CardCommandHandler {
  constructor(
    private readonly requestProvider: RequestProvider,
    private readonly cardsRepository: CardsRepository,
    private readonly projectService: ProjectService,
    private readonly cardsProjectService: CardsProjectService,
    private readonly commonTools: CommonTools,
    private readonly responseBuilder: ResponseBuilder,
    private readonly cardsService: CardsService,
    private readonly projectRepository: ProjectsRepository,
    private readonly automationService: AutomationService,
    private readonly cardPaymentService: CardsPaymentService,
    private readonly userRepository: UsersRepository,
    private readonly circleRepository: CirclesRepository,
    private readonly eventBus: EventBus,
    private readonly logger: LoggingService,
  ) {
    logger.setContext('CardCommandHandler');
  }

  async closeMultipleCards(
    multiCardCloseDto: MultiCardCloseWithSlugDto,
  ): Promise<boolean> {
    try {
      const globalUpdate = {
        card: {},
        project: {},
      } as GlobalDocumentUpdate;

      const cards = await this.cardsRepository.findAll({
        slug: { $in: multiCardCloseDto.slugs },
      });
      const project = await this.projectRepository.findById(
        cards[0].project as string,
      );

      for (const card of cards) {
        const cardUpdate = this.cardsService.closeCard(card);
        const automationUpdate = this.automationService.handleAutomation(
          card,
          project,
          cardUpdate[card.id],
          this.requestProvider.user.id,
        );
        globalUpdate.card[card.id] = this.commonTools.mergeObjects(
          globalUpdate.card[card.id],
          automationUpdate.card[card.id],
          cardUpdate[card.id],
        );
        globalUpdate.project[project.id] = this.commonTools.mergeObjects(
          globalUpdate.project[project.id],
          automationUpdate.project[project.id],
        );
      }

      const cardUpdateAcknowledgment =
        await this.cardsRepository.bundleUpdatesAndExecute(globalUpdate.card);

      const projectUpdateAcknowledgment =
        await this.projectRepository.bundleUpdatesAndExecute(
          globalUpdate.project,
        );

      return true;
    } catch (error) {
      this.logger.logError(
        `Failed while closing cards with error: ${error.message}`,
        this.requestProvider,
      );
      throw new InternalServerErrorException(
        'Failed closing cards',
        error.message,
      );
    }
  }
}
