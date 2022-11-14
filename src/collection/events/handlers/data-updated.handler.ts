import {
  CommandBus,
  EventsHandler,
  IEventHandler,
  QueryBus,
} from '@nestjs/cqrs';
import { GetPrivateViewCollectionQuery } from 'src/collection/queries';
import { LoggingService } from 'src/logging/logging.service';
import { RealtimeGateway } from 'src/realtime/realtime.gateway';
import { DataUpatedEvent } from '../impl/data-updated.event';

@EventsHandler(DataUpatedEvent)
export class DataUpatedEventHandler implements IEventHandler<DataUpatedEvent> {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
    private readonly logger: LoggingService,
    private readonly realtime: RealtimeGateway,
  ) {
    this.logger.setContext('DataUpatedEventHandler');
  }

  async handle(event: DataUpatedEvent) {
    try {
      console.log('DataUpatedEventHandler');
      const { caller, collection, update, existingData } = event;
      this.logger.log(`Update Data in collection ${event.collection?.name}`);
      const pvtCollection = await this.queryBus.execute(
        new GetPrivateViewCollectionQuery(collection.slug),
      );
      this.realtime.server.emit(`${collection.slug}:newActivityPrivate`, {
        data: pvtCollection,
        user: caller.id,
      });
      this.realtime.server.emit(`${collection.slug}:newActivityPublic`, {
        user: caller.id,
      });
    } catch (error) {
      this.logger.error(`${error.message}`);
    }
  }
}
