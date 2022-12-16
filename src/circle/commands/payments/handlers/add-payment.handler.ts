import { InternalServerErrorException } from '@nestjs/common';
import { CommandHandler, ICommandHandler, QueryBus } from '@nestjs/cqrs';
import { CirclesRepository } from 'src/circle/circles.repository';
import { AddPaymentsCommand } from '../impl/add-payment.command';
import { v4 as uuidv4 } from 'uuid';
import { Circle } from 'src/circle/model/circle.model';
import { PaymentDetails } from 'src/circle/types';
import { GetCollectionByIdQuery } from 'src/collection/queries';
import { GetProfileQuery, GetUserByFilterQuery } from 'src/users/queries/impl';
import { CommonTools } from 'src/common/common.service';
import { LoggingService } from 'src/logging/logging.service';

@CommandHandler(AddPaymentsCommand)
export class AddPaymentsCommandHandler
  implements ICommandHandler<AddPaymentsCommand>
{
  constructor(
    private readonly circlesRepository: CirclesRepository,
    private readonly queryBus: QueryBus,
    private readonly commonTools: CommonTools,
    private readonly logger: LoggingService,
  ) {
    this.logger.setContext(AddPaymentsCommandHandler.name);
  }

  async execute(command: AddPaymentsCommand): Promise<Circle> {
    try {
      const { circleId, addPaymentsDto } = command;
      const circleToUpdate = await this.circlesRepository.findById(circleId);
      if (!circleToUpdate) {
        throw new InternalServerErrorException(
          `Could not find circle with id ${circleId}`,
        );
      }
      const collection = await this.queryBus.execute(
        new GetCollectionByIdQuery(addPaymentsDto.collectionId),
      );
      if (!collection) {
        throw new InternalServerErrorException(
          `Could not find collection with id ${addPaymentsDto.collectionId}`,
        );
      }

      const pendingPayments = circleToUpdate.pendingPayments;
      const newPaymentDetails = {};
      let usersToFetch = [];
      for (const [dataSlug, paymentObj] of Object.entries(
        addPaymentsDto.dataSlugsToPaymentObj,
      )) {
        if (!paymentObj.payToProperty?.length) continue;
        if (
          collection.properties[paymentObj.payToProperty[0]]?.type === 'user'
        ) {
          usersToFetch = [...usersToFetch, paymentObj.payToProperty[0]];
        } else if (
          collection.properties[paymentObj.payToProperty[0]]?.type === 'user[]'
        ) {
          usersToFetch = [...usersToFetch, ...paymentObj.payToProperty[0]];
        }
      }
      const users = await this.queryBus.execute(
        new GetProfileQuery(
          {
            _id: {
              $in: usersToFetch,
            },
          },
          '',
        ),
      );
      const userObj = this.commonTools.objectify(users, 'id');
      for (const [dataSlug, paymentObj] of Object.entries(
        addPaymentsDto.dataSlugsToPaymentObj,
      )) {
        if (!paymentObj.payToProperty?.length) continue;
        if (
          collection.properties[paymentObj.payToProperty[0]]?.type ===
          'ethAddress'
        ) {
          paymentObj['paymentAddress'] = paymentObj.payToProperty[0];
        } else if (
          collection.properties[paymentObj.payToProperty[0]]?.type === 'user'
        ) {
          paymentObj['paymentAddress'] =
            userObj[paymentObj.payToProperty[0]].ethAddress;
        } else if (
          collection.properties[paymentObj.payToProperty[0]]?.type === 'user[]'
        ) {
          paymentObj['paymentAddress'] =
            userObj[paymentObj.payToProperty[0][0]].ethAddress;
        }
      }
      const paymentIds = [];

      for (const [dataSlug, paymentObj] of Object.entries(
        addPaymentsDto.dataSlugsToPaymentObj,
      )) {
        for (const rewardProperty of paymentObj.rewardProperty) {
          if (collection.data[dataSlug][rewardProperty]?.value > 0) {
            const paymentId = uuidv4();

            newPaymentDetails[paymentId] = {
              id: paymentId,
              chain: collection.data[dataSlug][rewardProperty].chain,
              token: collection.data[dataSlug][rewardProperty].token,
              value: collection.data[dataSlug][rewardProperty].value,
              paidTo: paymentObj['paymentAddress'],
              dataRef: dataSlug,
              collectionRef: addPaymentsDto.collectionId,
            } as PaymentDetails;
            paymentIds.push(paymentId);
          }
        }
      }
      const updatedCircle = await this.circlesRepository.updateById(circleId, {
        pendingPayments: [...(pendingPayments || []), ...paymentIds],
        paymentDetails: {
          ...circleToUpdate.paymentDetails,
          ...newPaymentDetails,
        },
      });
      return updatedCircle;
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }
}
