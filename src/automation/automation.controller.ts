import { Body, Controller, Get, Param, UseGuards } from '@nestjs/common';
import { SessionAuthGuard } from 'src/auth/iron-session.guard';
import { CardsRepository } from 'src/card/cards.repository';
import { UpdateCardRequestDto } from 'src/card/dto/update-card-request.dto';
import { ObjectIdDto } from 'src/common/dtos/object-id.dto';
import { ProjectsRepository } from 'src/project/project.repository';
import { ProjectService } from 'src/project/project.service';
import { AutomationService } from './automation.service';

@Controller('automation')
export class AutomationController {
  constructor(
    private readonly automationService: AutomationService,
    private readonly cardsRepository: CardsRepository,
    private readonly projectRepository: ProjectsRepository,
  ) {}
}
