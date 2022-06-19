import { forwardRef, Module } from '@nestjs/common';
import { TypegooseModule } from 'nestjs-typegoose';
import { SlugService } from 'src/common/slug.service';
import { Project } from './model/project.model';
import { ProjectController } from './project.controller';
import { ProjectService } from './project.service';
import { ProjectsRepository } from './project.repository';
import { CirclesModule } from 'src/circle/circles.module';
import { TemplatesModule } from 'src/template/templates.module';
import { CardsModule } from 'src/card/cards.module';
import { DataStructureManipulationService } from 'src/common/dataStructureManipulation.service';

@Module({
  imports: [
    TypegooseModule.forFeature([Project]),
    CirclesModule,
    forwardRef(() => TemplatesModule),
    forwardRef(() => CardsModule),
  ],
  controllers: [ProjectController],
  providers: [
    ProjectService,
    ProjectsRepository,
    SlugService,
    DataStructureManipulationService,
  ],
  exports: [ProjectService, ProjectsRepository, ProjectModule],
})
export class ProjectModule {}
