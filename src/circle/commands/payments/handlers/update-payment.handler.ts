import { InternalServerErrorException } from '@nestjs/common';
import {
  CommandBus,
  CommandHandler,
  EventBus,
  ICommandHandler,
  QueryBus,
} from '@nestjs/cqrs';
import { CirclesRepository } from 'src/circle/circles.repository';
import { UpdatedCircleEvent } from 'src/circle/events/impl';
import { PaymentDetails } from 'src/circle/types';
import { UpdateCollectionCommand } from 'src/collection/commands';
import { CollectionResponseDto } from 'src/collection/dto/collection-response.dto';
import { GetCollectionByIdQuery } from 'src/collection/queries';
import { LoggingService } from 'src/logging/logging.service';
import { UpdatePaymentsCommand } from '../impl';

@CommandHandler(UpdatePaymentsCommand)
export class UpdatePaymentCommandHandler
  implements ICommandHandler<UpdatePaymentsCommand>
{
  constructor(
    private readonly circlesRepository: CirclesRepository,
    private readonly queryBus: QueryBus,
    private readonly eventBus: EventBus,
    private readonly commandBus: CommandBus,
    private readonly logger: LoggingService,
  ) {
    this.logger.setContext(UpdatePaymentCommandHandler.name);
  }

  async execute(command: UpdatePaymentsCommand): Promise<PaymentDetails> {
    try {
      console.log('UpdatePaymentCommandHandler');
      const { circleId, paymentId, updatePaymentsDto, caller } = command;
      const circleToUpdate = await this.circlesRepository.findById(circleId);

      if (!circleToUpdate) {
        throw new InternalServerErrorException(
          `Could not find circle with id ${circleId}`,
        );
      }

      const updates = {
        paymentDetails: {
          ...circleToUpdate.paymentDetails,
          [paymentId]: {
            ...circleToUpdate.paymentDetails[paymentId],
            ...updatePaymentsDto,
          },
        },
      };
      if (updatePaymentsDto.status === 'Completed') {
        const currStatus = circleToUpdate.paymentDetails[paymentId].status;
        if (currStatus === 'Pending') {
          updates['pendingPayments'] = circleToUpdate.pendingPayments.filter(
            (id) => id !== paymentId,
          );
          updates['completedPayments'] = [
            ...(circleToUpdate.completedPayments || []),
            paymentId,
          ];
        }
      }
      if (updatePaymentsDto.status === 'Cancelled') {
        const currStatus = circleToUpdate.paymentDetails[paymentId].status;
        if (currStatus === 'Pending') {
          updates['pendingPayments'] = circleToUpdate.pendingPayments.filter(
            (id) => id !== paymentId,
          );
          updates['cancelledPayments'] = [
            ...(circleToUpdate.cancelledPayments || []),
            paymentId,
          ];
        }
      }

      const collectionUpdates = {};
      if (
        circleToUpdate.paymentDetails[paymentId].type === 'Added From Card' &&
        ['Completed', 'Cancelled'].includes(updatePaymentsDto.status)
      ) {
        const collection = await this.queryBus.execute(
          new GetCollectionByIdQuery(
            circleToUpdate.paymentDetails[paymentId].collectionId,
          ),
        );
        collectionUpdates['paymentStatus'] = {
          ...collection.paymentStatus,
          [circleToUpdate.paymentDetails[paymentId].dataSlug]:
            updatePaymentsDto.status === 'Completed' ? 'completed' : null,
        };

        await this.commandBus.execute(
          new UpdateCollectionCommand(
            collectionUpdates,
            caller,
            circleToUpdate.paymentDetails[paymentId].collectionId,
          ),
        );
      }

      const updatedCircle = await this.circlesRepository.updateById(
        circleId,
        updates,
      );
      this.eventBus.publish(
        new UpdatedCircleEvent(updatedCircle, caller.id, 'paymentUpdate'),
      );

      return updatedCircle.paymentDetails[paymentId];
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }
}
