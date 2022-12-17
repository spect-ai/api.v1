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
import { Collection } from 'src/collection/model/collection.model';

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
      console.log('AddPaymentsCommandHandler');
      const { circleId, addPaymentsDto } = command;
      const circleToUpdate = await this.circlesRepository.findById(circleId);
      if (!circleToUpdate) {
        throw new InternalServerErrorException(
          `Could not find circle with id ${circleId}`,
        );
      }
      const collection = (await this.queryBus.execute(
        new GetCollectionByIdQuery(addPaymentsDto.collectionId),
      )) as Collection;
      if (!collection) {
        throw new InternalServerErrorException(
          `Could not find collection with id ${addPaymentsDto.collectionId}`,
        );
      }

      const pendingPayments = circleToUpdate.pendingPayments;
      const rewardFieldToPayOn = Object.entries(collection.properties)
        .filter(([propertyId, property]) => {
          if (property.type === 'reward') return propertyId;
        })
        .map(([propertyId, property]) => propertyId);
      if (rewardFieldToPayOn.length === 0) {
        throw new InternalServerErrorException(
          `Reward property doesnt exist in collection ${addPaymentsDto.collectionId}`,
        );
      }
      console.log({ rewardFieldToPayOn });

      const rewardPaidTo = Object.entries(collection.properties)
        .filter(([propertyId, property]) => {
          if (['user', 'user[]', 'ethAddress'].includes(property.type))
            return propertyId;
        })
        .map(([propertyId, property]) => propertyId);
      if (rewardPaidTo.length === 0) {
        throw new InternalServerErrorException(
          `User[], user or ethAddress property doesnt exist in collection ${addPaymentsDto.collectionId}`,
        );
      }
      console.log({ rewardPaidTo });
      const newPaymentDetails = {};
      const paymentIds = [];
      console.log({ dataSlugs: addPaymentsDto.dataSlugs });
      for (const dataSlug of addPaymentsDto.dataSlugs) {
        if (collection.data[dataSlug][rewardFieldToPayOn[0]].value === 0)
          continue;
        const paymentId = uuidv4();
        const paidTo = [];
        if (collection.properties[rewardPaidTo[0]].type === 'user[]') {
          for (const user of collection.data[dataSlug][rewardPaidTo[0]]) {
            paidTo.push({
              propertyType: 'user',
              value: user,
            });
          }
        } else {
          paidTo.push({
            propertyType: collection.properties[rewardPaidTo[0]].type,
            value: collection.data[dataSlug][rewardPaidTo[0]],
          });
        }
        newPaymentDetails[paymentId] = {
          id: paymentId,
          type: 'addedFromCard',
          dataSlug,
          collectionId: addPaymentsDto.collectionId,
          chain: collection.data[dataSlug][rewardFieldToPayOn[0]].chain,
          token: collection.data[dataSlug][rewardFieldToPayOn[0]].token,
          value: collection.data[dataSlug][rewardFieldToPayOn[0]].value,
          paidTo: paidTo,
        };
        paymentIds.push(paymentId);
      }
      const updatedCircle = await this.circlesRepository.updateById(circleId, {
        pendingPayments: [...(pendingPayments || []), ...paymentIds],
        paymentDetails: {
          ...(circleToUpdate.paymentDetails || {}),
          ...newPaymentDetails,
        },
      });
      return updatedCircle;
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException(error);
    }
  }
}
