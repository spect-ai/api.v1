import { InternalServerErrorException } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { CirclesRepository } from 'src/circle/circles.repository';
import { PaymentDetails } from 'src/circle/types';
import { LoggingService } from 'src/logging/logging.service';
import { GetPaymentsQuery } from '../impl/get-payment.query';

@QueryHandler(GetPaymentsQuery)
export class GetPaymentsQueryHandler
  implements IQueryHandler<GetPaymentsQuery>
{
  constructor(
    private readonly circleRepository: CirclesRepository,
    private readonly logger: LoggingService,
  ) {
    logger.setContext('GetPaymentsQueryHandler');
  }

  async execute(query: GetPaymentsQuery): Promise<{
    pendingPayments: string[];
    paymentDetails: { [key: string]: PaymentDetails };
  }> {
    try {
      const circle = await this.circleRepository.findById(query.circleId);
      if (circle.pendingPayments?.length === 0) {
        return {
          pendingPayments: [],
          paymentDetails: null,
        };
      }

      return {
        pendingPayments: circle.pendingPayments,
        paymentDetails: circle.paymentDetails,
      };
    } catch (error) {
      this.logger.error(
        `Failed while getting circle using id with error: ${error.message}`,
        query,
      );
      throw new InternalServerErrorException(
        'Failed while getting circle using id',
        error.message,
      );
    }
  }
}
