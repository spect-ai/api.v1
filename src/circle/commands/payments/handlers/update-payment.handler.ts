import { InternalServerErrorException } from '@nestjs/common';
import {
  CommandBus,
  CommandHandler,
  ICommandHandler,
  QueryBus,
} from '@nestjs/cqrs';
import { CirclesRepository } from 'src/circle/circles.repository';
import { CollectionResponseDto } from 'src/collection/dto/collection-response.dto';
import { LoggingService } from 'src/logging/logging.service';
import { UpdatePaymentsCommand } from '../impl';

@CommandHandler(UpdatePaymentsCommand)
export class UpdatePaymentCommandHandler
  implements ICommandHandler<UpdatePaymentsCommand>
{
  constructor(
    private readonly circlesRepository: CirclesRepository,
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
    private readonly logger: LoggingService,
  ) {
    this.logger.setContext(UpdatePaymentCommandHandler.name);
  }

  async execute(command: UpdatePaymentsCommand): Promise<boolean> {
    try {
      console.log('UpdatePaymentCommandHandler');
      const { circleId, paymentId, updatePaymentsDto, caller } = command;
      const circleToUpdate = await this.circlesRepository.findById(circleId);

      if (!circleToUpdate) {
        throw new InternalServerErrorException(
          `Could not find circle with id ${circleId}`,
        );
      }

      const updatedCircle = await this.circlesRepository.updateById(circleId, {
        paymentDetails: {
          ...circleToUpdate.paymentDetails,
          [paymentId]: {
            ...circleToUpdate.paymentDetails[paymentId],
            ...updatePaymentsDto,
          },
        },
      });
      return true;
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }
}
