import { CommandBus, EventsHandler, IEventHandler } from '@nestjs/cqrs';
import {
  PerformAutomationOnPaymentCancelledCommand,
  PerformAutomationOnPaymentCompleteCommand,
} from 'src/automation/commands/impl';
import { LoggingService } from 'src/logging/logging.service';
import { RealtimeGateway } from 'src/realtime/realtime.gateway';
import { PaymentUpdateEvent } from '../impl/payment-update.event';

@EventsHandler(PaymentUpdateEvent)
export class PaymentUpdateEventHandler
  implements IEventHandler<PaymentUpdateEvent>
{
  constructor(
    private readonly commandBus: CommandBus,
    private readonly logger: LoggingService,
    private readonly realtime: RealtimeGateway,
  ) {
    this.logger.setContext('PaymentUpdateEventHandler');
  }

  async handle(event: PaymentUpdateEvent) {
    try {
      const { caller, circle, collection, paymentStatus } = event;

      for (const dataSlug of Object.keys(paymentStatus)) {
        console.log(paymentStatus, 'status');
        if (paymentStatus[dataSlug] === null) {
          await this.commandBus.execute(
            new PerformAutomationOnPaymentCancelledCommand(
              collection,
              {},
              dataSlug,
              caller,
              circle,
            ),
          );
        } else if (paymentStatus[dataSlug] === 'completed') {
          await this.commandBus.execute(
            new PerformAutomationOnPaymentCompleteCommand(
              collection,
              {},
              dataSlug,
              caller,
              circle,
            ),
          );
        }
      }
    } catch (error) {
      this.logger.error(`${error.message}`);
    }
  }
}
