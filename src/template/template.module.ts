import { Module } from '@nestjs/common';
import { TemplateController } from './template.controller';
import { CqrsModule } from '@nestjs/cqrs';

@Module({
  imports: [CqrsModule],
  controllers: [TemplateController],
})
export class TemplateModule {}
