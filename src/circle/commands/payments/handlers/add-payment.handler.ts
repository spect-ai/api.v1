import { InternalServerErrorException } from '@nestjs/common';
import { CommandHandler, ICommandHandler, QueryBus } from '@nestjs/cqrs';
import { CirclesRepository } from 'src/circle/circles.repository';
import { AddPaymentsCommand } from '../impl/add-payment.command';
import { v4 as uuidv4 } from 'uuid';
import { Circle } from 'src/circle/model/circle.model';
import { GetCollectionByIdQuery } from 'src/collection/queries';
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
      const rewardFieldToPayOn =
        collection.projectMetadata.payments.rewardField;
      if (!rewardFieldToPayOn) {
        throw new InternalServerErrorException(
          `Reward property doesnt exist in collection ${addPaymentsDto.collectionId}`,
        );
      }
      console.log({ rewardFieldToPayOn });
      const rewardPaidTo = collection.projectMetadata.payments.payeeField;
      if (!rewardPaidTo) {
        throw new InternalServerErrorException(
          `User[], user or ethAddress property doesnt exist in collection ${addPaymentsDto.collectionId}`,
        );
      }
      console.log({ rewardPaidTo });
      const newPaymentDetails = {};
      const paymentIds = [];
      console.log({ dataSlugs: addPaymentsDto.dataSlugs });
      for (const dataSlug of addPaymentsDto.dataSlugs) {
        if (collection.data[dataSlug][rewardFieldToPayOn].value === 0) continue;
        const paymentId = uuidv4();
        const paidTo = [];
        if (collection.properties[rewardPaidTo].type === 'user[]') {
          for (const user of collection.data[dataSlug][rewardPaidTo]) {
            paidTo.push({
              propertyType: 'user',
              value: user.value,
              reward:
                paidTo.length === 0
                  ? {
                      chain:
                        collection.data[dataSlug][rewardFieldToPayOn].chain,
                      token:
                        collection.data[dataSlug][rewardFieldToPayOn].token,
                      value:
                        collection.data[dataSlug][rewardFieldToPayOn].value,
                    }
                  : {
                      chain: null,
                      token: null,
                      value: 0,
                    },
            });
          }
        } else {
          paidTo.push({
            propertyType: collection.properties[rewardPaidTo].type,
            value:
              collection.properties[rewardPaidTo].type === 'user'
                ? collection.data[dataSlug][rewardPaidTo]?.value
                : collection.data[dataSlug][rewardPaidTo],
            reward:
              paidTo.length === 0
                ? {
                    chain: collection.data[dataSlug][rewardFieldToPayOn].chain,
                    token: collection.data[dataSlug][rewardFieldToPayOn].token,
                    value: collection.data[dataSlug][rewardFieldToPayOn].value,
                  }
                : {
                    chain: null,
                    token: null,
                    value: 0,
                  },
          });
        }

        newPaymentDetails[paymentId] = {
          id: paymentId,
          title: collection.data[dataSlug]['Title'],
          type: 'addedFromCard',
          dataSlug,
          collectionId: addPaymentsDto.collectionId,
          chain: collection.data[dataSlug][rewardFieldToPayOn].chain,
          token: collection.data[dataSlug][rewardFieldToPayOn].token,
          value: collection.data[dataSlug][rewardFieldToPayOn].value,
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
