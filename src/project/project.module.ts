import { Module } from '@nestjs/common';
import { TypegooseModule } from 'nestjs-typegoose';
import { CirclesService } from 'src/circles/circles.service';
import { SlugService } from 'src/common/slug.service';
import { Project } from './model/project.model';
import { ProjectController } from './project.controller';
import { ProjectService } from './project.service';

@Module({
  imports: [TypegooseModule.forFeature([Project])],
  controllers: [ProjectController],
  providers: [ProjectService, CirclesService, SlugService],
})
export class ProjectModule {}
