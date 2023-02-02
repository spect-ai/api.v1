import { InternalServerErrorException } from '@nestjs/common';
import {
  CommandBus,
  CommandHandler,
  ICommandHandler,
  QueryBus,
} from '@nestjs/cqrs';
import { CirclesRepository } from 'src/circle/circles.repository';
import { Circle } from 'src/circle/model/circle.model';
import { GetCircleByIdQuery } from 'src/circle/queries/impl';
import { PaymentDetails } from 'src/circle/types';
import { UpdateCollectionCommand } from 'src/collection/commands';
import { CollectionResponseDto } from 'src/collection/dto/collection-response.dto';
import { Collection } from 'src/collection/model/collection.model';
import {
  GetCollectionByFilterQuery,
  GetCollectionByIdQuery,
} from 'src/collection/queries';
import { LoggingService } from 'src/logging/logging.service';
import { User } from 'src/users/model/users.model';
import { v4 as uuidv4 } from 'uuid';
import {
  AddManualPaymentsCommand,
  AddPaymentsCommand,
} from '../impl/add-payment.command';

@CommandHandler(AddPaymentsCommand)
export class AddPaymentsCommandHandler
  implements ICommandHandler<AddPaymentsCommand>
{
  constructor(
    private readonly circlesRepository: CirclesRepository,
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
    private readonly logger: LoggingService,
  ) {
    this.logger.setContext(AddPaymentsCommandHandler.name);
  }

  async execute(
    command: AddPaymentsCommand,
  ): Promise<CollectionResponseDto | boolean> {
    try {
      console.log('AddPaymentsCommandHandler');
      const { circleId, addPaymentsDto, caller } = command;
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
      const rewardPaidTo = collection.projectMetadata.payments.payeeField;
      if (!rewardPaidTo) {
        throw new InternalServerErrorException(
          `User[], user or ethAddress property doesnt exist in collection ${addPaymentsDto.collectionId}`,
        );
      }
      const newPaymentDetails = {};
      const paymentIds = [];
      const dataSlugsPendingPayment = [];
      for (const dataSlug of addPaymentsDto.dataSlugs) {
        if (collection.data[dataSlug][rewardFieldToPayOn].value === 0) continue;
        if (
          collection.projectMetadata.paymentStatus &&
          ['pending', 'pendingSignature'].includes(
            collection.projectMetadata.paymentStatus[dataSlug],
          )
        )
          continue;
        const paymentId = uuidv4();
        const paidTo = [];
        if (collection.properties[rewardPaidTo].type === 'user[]') {
          for (const user of collection.data[dataSlug][rewardPaidTo]) {
            paidTo.push({
              propertyType: 'user',
              value: user,
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
            value: collection.data[dataSlug][rewardPaidTo],
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
          type: 'Added From Card',
          data: {
            label: collection.data[dataSlug]['Title'],
            value: dataSlug,
          },
          collection: {
            label: collection.name,
            value: collection.slug,
          },
          chain: collection.data[dataSlug][rewardFieldToPayOn].chain,
          token: collection.data[dataSlug][rewardFieldToPayOn].token,
          value: collection.data[dataSlug][rewardFieldToPayOn].value,
          paidTo: paidTo,
          status: 'Pending',
        } as PaymentDetails;
        paymentIds.push(paymentId);
        dataSlugsPendingPayment.push(dataSlug);
      }
      const updatedCircle = await this.circlesRepository.updateById(circleId, {
        pendingPayments: [...(pendingPayments || []), ...paymentIds],
        paymentDetails: {
          ...(circleToUpdate.paymentDetails || {}),
          ...newPaymentDetails,
        },
      });
      const updatedCollection = await this.updateData(
        addPaymentsDto.collectionId,
        dataSlugsPendingPayment,
        caller,
        paymentIds,
      );
      return updatedCollection;
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException(error);
    }
  }

  async updateData(
    collectionId: string,
    dataSlugs: string[],
    caller: User,
    pendingPaymentIds: string[],
  ): Promise<CollectionResponseDto | boolean> {
    try {
      const collection = (await this.queryBus.execute(
        new GetCollectionByIdQuery(collectionId),
      )) as Collection;
      if (!collection) {
        throw new InternalServerErrorException(
          `Could not find collection with id ${collectionId}`,
        );
      }

      const paymentStatus = {};
      const paymentIds = {};
      for (const [index, dataSlug] of dataSlugs.entries()) {
        paymentStatus[dataSlug] = 'pending';
        paymentIds[dataSlug] = pendingPaymentIds[index];
      }
      const updatedCollection = await this.commandBus.execute(
        new UpdateCollectionCommand(
          {
            projectMetadata: {
              ...collection.projectMetadata,
              paymentIds: {
                ...(collection.projectMetadata?.paymentIds || {}),
                ...paymentIds,
              },
              paymentStatus: {
                ...(collection.projectMetadata?.paymentStatus || {}),
                ...paymentStatus,
              },
            },
          },
          caller.id,
          collectionId,
        ),
      );
      return updatedCollection;
    } catch (err) {
      this.logger.error(err);
      return false;
    }
  }
}

@CommandHandler(AddManualPaymentsCommand)
export class AddManualPaymentsCommandHandler
  implements ICommandHandler<AddManualPaymentsCommand>
{
  constructor(
    private readonly circlesRepository: CirclesRepository,
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
    private readonly logger: LoggingService,
  ) {
    this.logger.setContext(AddManualPaymentsCommandHandler.name);
  }

  async execute(command: AddManualPaymentsCommand): Promise<boolean> {
    try {
      const { circleId, addManualPaymentDto, caller } = command;

      const circle = (await this.queryBus.execute(
        new GetCircleByIdQuery(circleId),
      )) as Circle;
      if (!circle) {
        throw new InternalServerErrorException(
          `Could not find circle with id ${circleId}`,
        );
      }
      const paymentId = uuidv4();
      if (addManualPaymentDto.type === 'Added From Card') {
        const collection = (await this.queryBus.execute(
          new GetCollectionByFilterQuery({
            slug: addManualPaymentDto.collection?.value,
          }),
        )) as Collection;
        const paymentIds = {
          ...(collection.projectMetadata?.paymentIds || {}),
          [addManualPaymentDto.data?.value]: paymentId,
        };
        const paymentStatus = {
          ...(collection.projectMetadata?.paymentStatus || {}),
          [addManualPaymentDto.data?.value]: 'pending' as
            | 'pending'
            | 'completed'
            | 'pendingSignature',
        };
        const updatedCollection = await this.commandBus.execute(
          new UpdateCollectionCommand(
            {
              projectMetadata: {
                ...collection.projectMetadata,
                paymentIds,
                paymentStatus,
              },
            },
            caller.id,
            collection.id,
          ),
        );
      }
      await this.circlesRepository.updateById(circleId, {
        pendingPayments: [...(circle.pendingPayments || []), paymentId],
        paymentDetails: {
          ...(circle.paymentDetails || {}),
          [paymentId]: {
            id: paymentId,
            status: 'Pending',
            ...addManualPaymentDto,
          },
        },
      });
      return true;
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException(error);
    }
  }
}
