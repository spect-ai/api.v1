export * from './impl/create-collection.command';
export * from './impl/update-collection.command';
export * from './impl/delete-collection.command';
export * from './impl/migrate-collection.command';
export * from './impl/import.command';
export * from './impl/get-changelog.command';
export * from './properties/impl/add-property.command';
export * from './properties/impl/update-property.command';
export * from './properties/impl/remove-property.command';
export * from './data/impl/add-data.command';
export * from './data/impl/update-data.command';
export * from './data/impl/remove-data.command';
export * from './comments/impl/add-comment.command';
export * from './comments/impl/update-comment.command';
export * from './comments/impl/remove-comment.command';
export * from './impl/migrate-collection.command';
export * from './data/impl/save-draft.command';
export * from './data/impl/delete-draft.command';
export * from './metrics/impl/update-metrics.command';
export * from './data/v2/impl/add-data.command';
export * from './data/v2/impl/update-data.command';
export * from './subscription/impl/create-subscription.command';
export * from './subscription/impl/remove-subscription.command';
export * from './v2/impl/duplicate-collection.command';
export * from './v2/impl/move-collection.command';

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
import {
  UpdateDataCommandHandler,
  UpdateDataUsingAutomationCommandHandler,
} from './data/handlers/update-data.handler';
import {
  EndVotingPeriodCommandHandler,
  RecordSnapshotProposalCommandHandler,
  StartVotingPeriodCommandHandler,
  VoteDataCommandHandler,
} from './data/handlers/vote-data.handler';
import { CreateCollectionCommandHandler } from './handlers/create-collection.handler';
import { DeleteCollectionCommandHandler } from './handlers/delete-collection.handler';
import {
  UpdateCollectionByFilterCommandHandler,
  UpdateCollectionCommandHandler,
} from './handlers/update-collection.handler';
import { AddPropertyCommandHandler } from './properties/handlers/add-property.handler';
import { RemovePropertyCommandHandler } from './properties/handlers/remove-property.handler';
import { UpdatePropertyCommandHandler } from './properties/handlers/update-property.handler';
import { OnboardToSpectProjectCommandHandler } from './default/handlers/onboard-to-spect.handler';

import { ImportCommandHandler } from './handlers/import.handler';
import { MigrateAllCollectionsCommandHandler } from './handlers/migrate-collection.handler';
import {
  SaveAndPostPaymentCommandHandler,
  SaveAndPostSocialsCommandHandler,
  SaveDraftCommandHandler,
} from './data/handlers/save-draft.handler';
import { GetChangelogCommandHandler } from './handlers/get-changelog.handler';
import { DeleteDraftCommandHandler } from './data/handlers/delete-draft.handler';
import {
  UpdatePageVisitMetricsCommandHandler,
  UpdateTimeSpentMetricsCommandHandler,
} from './metrics/handlers/update-metrics.handler';
import { AddProjectDataCommandHandler } from './data/v2/handlers/add-data.handler';
import { UpdateProjectDataCommandHandler } from './data/v2/handlers/update-data.handler';
import {
  SendEventToSubscribersCommandHandler,
  SubscribeToEventCommandHandler,
} from './subscription/handlers/create-subscription.handler';
import { RemoveSubscriptionCommandHandler } from './subscription/handlers/remove-subscription.handler';
import {
  DuplicateFormCommandHandler,
  DuplicateProjectCommandHandler,
} from './v2/handlers/duplicate-collection.handler';
import { MoveCollectionCommandHandler } from './v2/handlers/move-collection.handler';

export const CommandHandlers = [
  CreateCollectionCommandHandler,
  UpdateCollectionCommandHandler,
  AddPropertyCommandHandler,
  UpdatePropertyCommandHandler,
  RemovePropertyCommandHandler,
  AddDataCommandHandler,
  UpdateDataCommandHandler,
  UpdateDataUsingAutomationCommandHandler,
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
  OnboardToSpectProjectCommandHandler,
  RecordSnapshotProposalCommandHandler,
  ImportCommandHandler,
  UpdateCollectionByFilterCommandHandler,
  MigrateAllCollectionsCommandHandler,
  SaveDraftCommandHandler,
  SaveAndPostSocialsCommandHandler,
  SaveAndPostPaymentCommandHandler,
  GetChangelogCommandHandler,
  DeleteDraftCommandHandler,
  UpdatePageVisitMetricsCommandHandler,
  UpdateTimeSpentMetricsCommandHandler,
  AddProjectDataCommandHandler,
  UpdateProjectDataCommandHandler,
  SendEventToSubscribersCommandHandler,
  SubscribeToEventCommandHandler,
  RemoveSubscriptionCommandHandler,
  DuplicateFormCommandHandler,
  DuplicateProjectCommandHandler,
  MoveCollectionCommandHandler,
];
