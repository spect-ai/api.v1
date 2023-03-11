import { CommandBus, EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { LoggingService } from 'src/logging/logging.service';
import { CollectionUpdatedEvent } from '../impl/collection-updated.event';
import { PoapService } from 'src/credentials/services/poap.service';
// const WorkersKVREST = require('@sagi.io/workers-kv');
import * as dotenv from 'dotenv';

dotenv.config();

const cfAccountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const cfAuthKey = process.env.CLOUDFLARE_AUTH_KEY;
const cfEmail = process.env.CLOUDFLARE_EMAIL;
const namespaceId = process.env.CLOUDFLARE_NAMESPACE_ID;

console.log({ cfAccountId, cfAuthKey, cfEmail, namespaceId });

// const WorkersKV = new WorkersKVREST({
//   cfAccountId,
//   cfAuthKey,
//   cfEmail,
//   namespaceId,
// });

@EventsHandler(CollectionUpdatedEvent)
export class CollectionUpdatedEventHandler
  implements IEventHandler<CollectionUpdatedEvent>
{
  constructor(
    private readonly commandBus: CommandBus,
    private readonly logger: LoggingService,
    private readonly poapService: PoapService,
  ) {
    this.logger.setContext('CollectionUpdatedEventHandler');
  }

  async handle(event: CollectionUpdatedEvent) {
    try {
      console.log('CollectionUpdatedEvent');
      const { caller, collection, update } = event;
      // const res = await WorkersKV.writeKey({
      //   key: collection.slug,
      //   value: JSON.stringify(collection),
      // });
      //console.log({ res });
      this.logger.log(`Created Collection: ${collection.name}`);
    } catch (error) {
      this.logger.error(`${error.message}`);
    }
  }
}
