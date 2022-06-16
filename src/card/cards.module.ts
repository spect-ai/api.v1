import { Module } from '@nestjs/common';
import { TypegooseModule } from 'nestjs-typegoose';
import { CirclesModule } from 'src/circle/circles.module';
import { ActivityBuilder } from 'src/common/activity.builder';
import { SlugService } from 'src/common/slug.service';
import { ProjectModule } from 'src/project/project.module';
import { ProjectService } from 'src/project/project.service';
import { TemplatesModule } from 'src/template/templates.module';
import { UserProvider } from 'src/users/user.provider';
import { CardsController } from './cards.controller';
import { CardsRepository } from './cards.repository';
import { CardsService } from './cards.service';
import { Card } from './model/card.model';

@Module({
  imports: [
    TypegooseModule.forFeature([Card]),
    ProjectModule,
    CirclesModule,
    TemplatesModule,
  ],
  controllers: [CardsController],
  providers: [
    CardsService,
    CardsRepository,
    SlugService,
    UserProvider,
    ActivityBuilder,
    ProjectService,
  ],
  exports: [CardsService, CardsRepository, CardsModule],
})
export class CardsModule {}
