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
import { Circle } from 'src/circle/model/circle.model';
import { PaymentDetails } from 'src/circle/types';
import { UpdateCollectionCommand } from 'src/collection/commands';
import { GetCollectionBySlugQuery } from 'src/collection/queries';
import { LoggingService } from 'src/logging/logging.service';
import { UpdateMultiplePaymentsCommand, UpdatePaymentsCommand } from '../impl';

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
            paymentId,
            ...(circleToUpdate.completedPayments || []),
          ];
        }
      } else if (updatePaymentsDto.status === 'Cancelled') {
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
      } else if (updatePaymentsDto.status === 'Pending Signature') {
        const currStatus = circleToUpdate.paymentDetails[paymentId].status;
        if (currStatus === 'Pending') {
          updates['pendingPayments'] = circleToUpdate.pendingPayments.filter(
            (id) => id !== paymentId,
          );
          updates['pendingSignaturePayments'] = [
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
          new GetCollectionBySlugQuery(
            circleToUpdate.paymentDetails[paymentId].collection
              ?.value as string,
          ),
        );
        collectionUpdates['projectMetadata'] = {
          ...(collection.projectMetadata || {}),
          paymentStatus: {
            ...(collection.projectMetadata.paymentStatus || {}),
            [circleToUpdate.paymentDetails[paymentId].data?.value]:
              updatePaymentsDto.status === 'Completed' ? 'completed' : null,
          },
        };

        await this.commandBus.execute(
          new UpdateCollectionCommand(
            collectionUpdates,
            caller.id,
            collection.id,
          ),
        );
      }

      const updatedCircle = await this.circlesRepository.updateById(
        circleId,
        updates,
      );

      console.log();
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

@CommandHandler(UpdateMultiplePaymentsCommand)
export class UpdateMultiplePaymentsCommandHandler
  implements ICommandHandler<UpdateMultiplePaymentsCommand>
{
  constructor(
    private readonly circlesRepository: CirclesRepository,
    private readonly queryBus: QueryBus,
    private readonly eventBus: EventBus,
    private readonly commandBus: CommandBus,
    private readonly logger: LoggingService,
  ) {
    this.logger.setContext(UpdateMultiplePaymentsCommandHandler.name);
  }

  async execute(command: UpdateMultiplePaymentsCommand): Promise<Circle> {
    try {
      console.log('UpdateMultiplePaymentsCommandHandler');
      const { circleId, paymentIds, updatePaymentsDto, caller } = command;
      const circleToUpdate = await this.circlesRepository.findById(circleId);

      if (!circleToUpdate) {
        throw new InternalServerErrorException(
          `Could not find circle with id ${circleId}`,
        );
      }
      const updates = {
        paymentDetails: circleToUpdate.paymentDetails,
        pendingPayments: circleToUpdate.pendingPayments,
        completedPayments: circleToUpdate.completedPayments,
        cancelledPayments: circleToUpdate.cancelledPayments,
        pendingSignaturePayments: circleToUpdate.pendingSignaturePayments,
      };
      for (const paymentId of paymentIds) {
        updates['paymentDetails'] = {
          ...updates.paymentDetails,
          [paymentId]: {
            ...updates.paymentDetails[paymentId],
            ...updatePaymentsDto,
          },
        };
        const currStatus = circleToUpdate.paymentDetails[paymentId].status;

        if (updatePaymentsDto.status === 'Completed') {
          if (currStatus === 'Pending') {
            updates['pendingPayments'] = updates.pendingPayments.filter(
              (id) => id !== paymentId,
            );
          } else if (currStatus === 'Pending Signature') {
            updates['pendingSignaturePayments'] =
              updates.pendingSignaturePayments.filter((id) => id !== paymentId);
          }
          updates['completedPayments'] = [
            paymentId,
            ...(updates.completedPayments || []),
          ];
        } else if (updatePaymentsDto.status === 'Cancelled') {
          if (currStatus === 'Pending') {
            updates['pendingPayments'] = updates.pendingPayments.filter(
              (id) => id !== paymentId,
            );
          } else if (currStatus === 'Pending Signature') {
            updates['pendingSignaturePayments'] =
              updates.pendingSignaturePayments.filter((id) => id !== paymentId);
          }
          updates['cancelledPayments'] = [
            ...(updates.cancelledPayments || []),
            paymentId,
          ];
        } else if (updatePaymentsDto.status === 'Pending Signature') {
          if (currStatus === 'Pending') {
            updates['pendingPayments'] = updates.pendingPayments.filter(
              (id) => id !== paymentId,
            );
          }
          updates['pendingSignaturePayments'] = [
            ...(updates.pendingSignaturePayments || []),
            paymentId,
          ];
        }

        const collectionUpdates = {};

        if (
          circleToUpdate.paymentDetails[paymentId].type === 'Added From Card' &&
          ['Completed', 'Cancelled'].includes(updatePaymentsDto.status)
        ) {
          const collection = await this.queryBus.execute(
            new GetCollectionBySlugQuery(
              circleToUpdate.paymentDetails[paymentId].collection
                ?.value as string,
            ),
          );
          collectionUpdates['projectMetadata'] = {
            ...(collection.projectMetadata || {}),
            paymentStatus: {
              ...(collection.projectMetadata.paymentStatus || {}),
              [circleToUpdate.paymentDetails[paymentId].data?.value]:
                updatePaymentsDto.status === 'Completed' ? 'completed' : null,
            },
          };

          await this.commandBus.execute(
            new UpdateCollectionCommand(
              collectionUpdates,
              caller.id,
              collection.id,
            ),
          );
        }
      }
      const updatedCircle = await this.circlesRepository.updateById(
        circleId,
        updates,
      );
      this.eventBus.publish(
        new UpdatedCircleEvent(updatedCircle, caller.id, 'paymentUpdate'),
      );

      return updatedCircle;
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }
}