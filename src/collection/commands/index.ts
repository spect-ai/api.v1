export * from './impl/create-collection.command';
export * from './impl/update-collection.command';
export * from './impl/delete-collection.command';
export * from './impl/migrate-collection.command';
export * from './properties/impl/add-property.command';
export * from './properties/impl/update-property.command';
export * from './properties/impl/remove-property.command';
export * from './data/impl/add-data.command';
export * from './data/impl/update-data.command';
export * from './data/impl/remove-data.command';
export * from './comments/impl/add-comment.command';
export * from './comments/impl/update-comment.command';
export * from './comments/impl/remove-comment.command';

import { AddCommentCommandHandler } from './comments/handlers/add-comment.handler';
import { RemoveCommentCommandHandler } from './comments/handlers/remove-comment.handler';
import { UpdateCommentCommandHandler } from './comments/handlers/update-comment.handler';
import {
  AddDataCommandHandler,
  AddDataUsingAutomationCommandHandler,
  AddMultipleDataUsingAutomationCommandHandler,
} from './data/handlers/add-data.handler';
import {
  RemoveDataCommandHandler,
  RemoveMultipleDataCommandHandler,
} from './data/handlers/remove-data.handler';
import { UpdateDataCommandHandler } from './data/handlers/update-data.handler';
import {
  EndVotingPeriodCommandHandler,
  RecordSnapshotProposalCommandHandler,
  StartVotingPeriodCommandHandler,
  VoteDataCommandHandler,
} from './data/handlers/vote-data.handler';
import { CreateCollectionCommandHandler } from './handlers/create-collection.handler';
import { DeleteCollectionCommandHandler } from './handlers/delete-collection.handler';
import { UpdateCollectionCommandHandler } from './handlers/update-collection.handler';
import {
  MigrateAllCollectionsCommandHandler,
  MigrateCollectionCommandHandler,
} from './handlers/migrate-collection.handler';
import { AddPropertyCommandHandler } from './properties/handlers/add-property.handler';
import { RemovePropertyCommandHandler } from './properties/handlers/remove-property.handler';
import { UpdatePropertyCommandHandler } from './properties/handlers/update-property.handler';
import { CreateGrantWorkflowCommandHandler } from './template/handlers/grant-workflow.handler';
import { OnboardingWorkflowCommandHandler } from './template/handlers/onboarding-workflow.handler';
import { KanbanProjectCommandHandler } from './template/handlers/kanban-project.handler';
import { OnboardToSpectProjectCommandHandler } from './default/handlers/onboard-to-spect.handler';

export const CommandHandlers = [
  CreateCollectionCommandHandler,
  UpdateCollectionCommandHandler,
  MigrateCollectionCommandHandler,
  MigrateAllCollectionsCommandHandler,
  AddPropertyCommandHandler,
  UpdatePropertyCommandHandler,
  RemovePropertyCommandHandler,
  AddDataCommandHandler,
  UpdateDataCommandHandler,
  RemoveDataCommandHandler,
  RemoveMultipleDataCommandHandler,
  AddCommentCommandHandler,
  UpdateCommentCommandHandler,
  RemoveCommentCommandHandler,
  VoteDataCommandHandler,
  AddDataUsingAutomationCommandHandler,
  StartVotingPeriodCommandHandler,
  EndVotingPeriodCommandHandler,
  DeleteCollectionCommandHandler,
  AddMultipleDataUsingAutomationCommandHandler,
  CreateGrantWorkflowCommandHandler,
  OnboardingWorkflowCommandHandler,
  KanbanProjectCommandHandler,
  OnboardToSpectProjectCommandHandler,
  RecordSnapshotProposalCommandHandler,
];
