import { Module } from '@nestjs/common';
import { TypegooseModule } from 'nestjs-typegoose';
import { Workflows } from './model/workflows.model';
import { WorkflowRepository } from './workflows.repository';
import { WorkflowController } from './workflow.controller';
import { WorkflowService } from './workflow.service';
import { CqrsModule } from '@nestjs/cqrs';

@Module({
  imports: [TypegooseModule.forFeature([Workflows]), CqrsModule],
  controllers: [WorkflowController],
  providers: [WorkflowService, WorkflowRepository, Workflows],
  exports: [WorkflowService, WorkflowRepository, Workflows],
})
export class WorkflowsModule {}
