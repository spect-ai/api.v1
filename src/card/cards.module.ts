import { Module } from '@nestjs/common';
import { TypegooseModule } from 'nestjs-typegoose';
import { CirclesModule } from 'src/circle/circles.module';
import { CirclesRepository } from 'src/circle/circles.repository';
import { ActivityBuilder } from 'src/common/activity.builder';
import { SlugService } from 'src/common/slug.service';
import { ProjectModule } from 'src/project/project.module';
import { ProjectsRepository } from 'src/project/project.repository';
import { ProjectService } from 'src/project/project.service';
import { UserProvider } from 'src/users/user.provider';
import { CardsController } from './cards.controller';
import { CardsRepository } from './cards.repository';
import { CardsService } from './cards.service';
import { Card } from './model/card.model';

@Module({
  imports: [TypegooseModule.forFeature([Card]), ProjectModule, CirclesModule],
  controllers: [CardsController],
  providers: [
    CardsService,
    CardsRepository,
    SlugService,
    UserProvider,
    ActivityBuilder,
    ProjectService,
    ProjectsRepository,
    CirclesRepository,
  ],
  exports: [CardsService, CardsRepository, CardsModule],
})
export class CardsModule {}
