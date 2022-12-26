import { InternalServerErrorException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CirclesRepository } from 'src/circle/circles.repository';
import { CircleResponseDto } from 'src/circle/dto/detailed-circle-response.dto';
import { Circle } from 'src/circle/model/circle.model';
import { LoggingService } from 'src/logging/logging.service';
import { MoveItemCommand } from 'src/users/commands/impl';
import { MovePaymentsCommand } from '../impl';

@CommandHandler(MovePaymentsCommand)
export class MovePaymentsCommandHandler
  implements ICommandHandler<MovePaymentsCommand>
{
  constructor(
    private readonly circleRepository: CirclesRepository,
    private readonly logger: LoggingService,
  ) {
    this.logger.setContext('MovePaymentsCommandHandler');
  }

  async execute(command: MovePaymentsCommand): Promise<CircleResponseDto> {
    try {
      console.log('MakePaymentsCommandHandler');
      const { movePaymentsDto, circleId } = command;
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

      for (const paymentId of paymentIds)
        if (to === 'completed' && from === 'pending') {
          updates['paymentDetails'] = {
            ...(circleToUpdate.paymentDetails || {}),
            [paymentId]: {
              ...(circleToUpdate.paymentDetails || {})[paymentId],
              paidOn: new Date(),
            },
          };
        } else if (to === 'cancelled' && from === 'pending') {
          updates['paymentDetails'] = {
            ...(circleToUpdate.paymentDetails || {}),
            [paymentId]: {
              ...(circleToUpdate.paymentDetails || {})[paymentId],
              cancelledOn: new Date(),
            },
          };
        }

      const updatedCircle = await this.circleRepository.updateById(
        circleId,
        updates,
      );
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
}