import {
  CommandBus,
  EventBus,
  EventsHandler,
  IEventHandler,
} from '@nestjs/cqrs';
import { LoggingService } from 'src/logging/logging.service';
import { RealtimeGateway } from 'src/realtime/realtime.gateway';
import { UpdatedCircleEvent } from '../impl/updated-circle.event';

@EventsHandler(UpdatedCircleEvent)
export class UpdatedCircleEventHandler
  implements IEventHandler<UpdatedCircleEvent>
{
  constructor(
    private readonly eventBus: EventBus,
    private readonly commandBus: CommandBus,
    private readonly logger: LoggingService,
    private readonly realtime: RealtimeGateway,
  ) {
    this.logger.setContext('UpdatedCircleEventHandler');
  }

  async handle(event: UpdatedCircleEvent) {
    try {
      const { caller, circle, eventName } = event;
      if (eventName === 'paymentUpdate') {
        console.log('UpdatedCircleEvent');

        this.realtime.server.emit(`${circle.slug}:paymentUpdate`, {
          data: {
            paymentDetails: circle.paymentDetails,
            pendingPayments: circle.pendingPayments,
            cancelledPayments: circle.cancelledPayments,
            completedPayments: circle.completedPayments,
            pendingSignaturePayments: circle.pendingSignaturePayments,
            circleSlug: circle.slug,
          },
          user: caller,
        });
      }
    } catch (error) {
      this.logger.error(`${error.message}`);
    }
  }
}
