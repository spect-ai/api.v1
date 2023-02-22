import { DataAddedEventHandler } from './handlers/data-added.handler';
import { DataRemovedEventHandler } from './handlers/data-removed.handler';
import { DataUpatedEventHandler } from './handlers/data-updated.handler';
import { CollectionCreatedEventHandler } from './handlers/collection-created.handler';
import { CommentAddedEventHandler } from './handlers/comment-added.handler';
import { VotingStartedEventHandler } from './handlers/voting-started.handler';
import { VotingEndedEventHandler } from './handlers/voting-ended.handler';
import { CollectionUpdatedEventHandler } from './handlers/collection-updated.handler';

export * from './impl/data-added.event';
export * from './impl/data-updated.event';
export * from './impl/data-removed.event';
export * from './impl/collection-created.event';
export * from './impl/comment-added.event';
export * from './impl/voting-started.event';
export * from './impl/voting-ended.event';
export * from './impl/collection-updated.event';

export const EventHandlers = [
  DataAddedEventHandler,
  DataUpatedEventHandler,
  DataRemovedEventHandler,
  CollectionCreatedEventHandler,
  CommentAddedEventHandler,
  VotingStartedEventHandler,
  VotingEndedEventHandler,
  CollectionUpdatedEventHandler,
];
