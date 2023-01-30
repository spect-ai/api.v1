import { InternalServerErrorException } from '@nestjs/common';
import {
  CommandBus,
  CommandHandler,
  ICommandHandler,
  QueryBus,
} from '@nestjs/cqrs';
import { CirclesRepository } from 'src/circle/circles.repository';
import { CircleResponseDto } from 'src/circle/dto/detailed-circle-response.dto';
import { Circle } from 'src/circle/model/circle.model';
import { UpdateCollectionCommand } from 'src/collection/commands';
import { GetCollectionByIdQuery } from 'src/collection/queries';
import { LoggingService } from 'src/logging/logging.service';
import { MoveItemCommand } from 'src/users/commands/impl';
import { User } from 'src/users/model/users.model';
import { MovePaymentsCommand } from '../impl';

@CommandHandler(MovePaymentsCommand)
export class MovePaymentsCommandHandler
  implements ICommandHandler<MovePaymentsCommand>
{
  constructor(
    private readonly circleRepository: CirclesRepository,
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
    private readonly logger: LoggingService,
  ) {
    this.logger.setContext('MovePaymentsCommandHandler');
  }

  async execute(command: MovePaymentsCommand): Promise<CircleResponseDto> {
    try {
      console.log('MakePaymentsCommandHandler');
      const { movePaymentsDto, circleId, transactionHash, caller } = command;
      const circleToUpdate = await this.circleRepository.findById(circleId);
      if (!circleToUpdate) {
        throw new InternalServerErrorException(
          `Could not find circle with id ${circleId}`,
        );
      }
      const { from, to, paymentIds } = movePaymentsDto;
      const updates = {};
      if (to === 'pending')
        updates['pendingPayments'] = [
          ...(circleToUpdate.pendingPayments || []),
          ...paymentIds,
        ];
      else if (to === 'completed')
        updates['completedPayments'] = [
          ...(circleToUpdate.completedPayments || []),
          ...paymentIds,
        ];
      else if (to === 'cancelled')
        updates['cancelledPayments'] = [
          ...(circleToUpdate.cancelledPayments || []),
          ...paymentIds,
        ];

      if (from === 'pending')
        updates['pendingPayments'] =
          circleToUpdate.pendingPayments &&
          circleToUpdate.pendingPayments.filter(
            (paymentId) => !paymentIds.includes(paymentId),
          );
      else if (from === 'completed')
        updates['completedPayments'] =
          circleToUpdate.completedPayments &&
          circleToUpdate.completedPayments.filter(
            (paymentId) => !paymentIds.includes(paymentId),
          );
      else if (from === 'cancelled')
        updates['cancelledPayments'] =
          circleToUpdate.cancelledPayments &&
          circleToUpdate.cancelledPayments.filter(
            (paymentId) => !paymentIds.includes(paymentId),
          );

      const paymentStatus = {};
      for (const paymentId of paymentIds) {
        console.log({ to });
        if (
          circleToUpdate.paymentDetails[paymentId] &&
          circleToUpdate.paymentDetails[paymentId].type === 'Added From Card'
        ) {
          if (['pending', 'pendingSignature', 'completed'].includes(to))
            paymentStatus[
              circleToUpdate.paymentDetails[paymentId].collection?.value
            ] = {
              ...(paymentStatus[
                circleToUpdate.paymentDetails[paymentId].collection?.value
              ] || {}),
              [circleToUpdate.paymentDetails[paymentId].data?.value]: to,
            };
          else if (to === 'cancelled')
            paymentStatus[
              circleToUpdate.paymentDetails[paymentId].collection?.value
            ] = {
              ...(paymentStatus[
                circleToUpdate.paymentDetails[paymentId].collection?.value
              ] || {}),
              [circleToUpdate.paymentDetails[paymentId].data?.value]: null,
            };
        }

        console.log({ paymentId, to, from });
        if (to === 'completed' && from === 'pending') {
          updates['paymentDetails'] = {
            ...(circleToUpdate.paymentDetails || {}),
            ...(updates['paymentDetails'] || {}),
            [paymentId]: {
              ...(circleToUpdate.paymentDetails || {})[paymentId],
              paidOn: new Date(),
              status: 'Completed',
            },
          };
        } else if (to === 'cancelled' && from === 'pending') {
          updates['paymentDetails'] = {
            ...(circleToUpdate.paymentDetails || {}),
            ...(updates['paymentDetails'] || {}),
            [paymentId]: {
              ...(circleToUpdate.paymentDetails || {})[paymentId],
              cancelledOn: new Date(),
              status: 'Cancelled',
            },
          };
        }
      }
      if (transactionHash) {
        for (const paymentId of paymentIds)
          if (circleToUpdate.paymentDetails[paymentId]?.token.value === '0x0') {
            updates['paymentDetails'] = {
              ...(updates['paymentDetails'] || {}),
              [paymentId]: {
                ...(updates['paymentDetails'] || {})[paymentId],
                transactionHash: transactionHash['currency'],
              },
            };
          } else {
            updates['paymentDetails'] = {
              ...(updates['paymentDetails'] || {}),
              [paymentId]: {
                ...(updates['paymentDetails'] || {})[paymentId],
                transactionHash: transactionHash['tokens'],
              },
            };
          }
      }

      const updatedCircle = await this.circleRepository.updateById(
        circleId,
        updates,
      );
      await this.updateCollectionPaymentStatus(paymentStatus, caller);
      return await this.circleRepository.getCircleWithMinimalDetails(
        updatedCircle,
      );
    } catch (error) {
      this.logger.error(
        `Failed move item with error: ${error.message}`,
        command,
      );
    }
  }

  async updateCollectionPaymentStatus(
    paymentStatus: { [collectionId: string]: { [dataSlug: string]: string } },
    caller: User,
  ): Promise<void> {
    for (const collectionId of Object.keys(paymentStatus)) {
      try {
        const collection = await this.queryBus.execute(
          new GetCollectionByIdQuery(collectionId),
        );
        if (!collection) {
          throw new InternalServerErrorException(
            `Could not find collection with id ${collectionId}`,
          );
        }
        const updates = {};
        for (const dataSlug of Object.keys(paymentStatus[collectionId])) {
          updates['projectMetadata'] = {
            ...(collection['projectMetadata'] || {}),
            paymentStatus: {
              ...(collection['projectMetadata']?.paymentStatus || {}),
              [dataSlug]: paymentStatus[collectionId][dataSlug],
            },
          };
        }
        await this.commandBus.execute(
          new UpdateCollectionCommand(updates, caller, collectionId),
        );
      } catch (error) {
        this.logger.error(
          `Failed to update collection payment status with error: ${error}`,
        );
      }
    }
  }
}
