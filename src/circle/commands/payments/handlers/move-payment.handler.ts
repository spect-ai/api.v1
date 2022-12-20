import { InternalServerErrorException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CirclesRepository } from 'src/circle/circles.repository';
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

  async execute(command: MovePaymentsCommand): Promise<Circle> {
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

      const updatedCircle = await this.circleRepository.updateById(
        circleId,
        updates,
      );
      return updatedCircle;
    } catch (error) {
      this.logger.error(
        `Failed move item with error: ${error.message}`,
        command,
      );
    }
  }
}
