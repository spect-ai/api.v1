import { Module } from '@nestjs/common';
import { TypegooseModule } from 'nestjs-typegoose';
import { CirclesModule } from 'src/circle/circles.module';
import { ProjectModule } from 'src/project/project.module';
import { UserProvider } from 'src/users/user.provider';
import { Template } from './models/template.model';
import { TemplatesRepository } from './tempates.repository';
import { TemplatesController } from './templates.controller';
import { TemplatesService } from './templates.service';

@Module({
  imports: [
    TypegooseModule.forFeature([Template]),
    ProjectModule,
    CirclesModule,
  ],
  controllers: [TemplatesController],
  providers: [TemplatesRepository, TemplatesService, UserProvider],
  exports: [TemplatesRepository, TemplatesService, TemplatesModule],
})
export class TemplatesModule {}
