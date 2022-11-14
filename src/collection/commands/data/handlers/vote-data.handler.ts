import { InternalServerErrorException } from '@nestjs/common';
import { CommandHandler, ICommandHandler, QueryBus } from '@nestjs/cqrs';
import { CollectionRepository } from 'src/collection/collection.repository';
import { LoggingService } from 'src/logging/logging.service';
import { GetPrivateViewCollectionQuery } from 'src/collection/queries';
import { VoteDataCommand } from '../impl/vote-data.command';

@CommandHandler(VoteDataCommand)
export class VoteDataCommandHandler
  implements ICommandHandler<VoteDataCommand>
{
  constructor(
    private readonly collectionRepository: CollectionRepository,
    private readonly queryBus: QueryBus,
    private readonly logger: LoggingService,
  ) {
    this.logger.setContext('UpdateDataCommandHandler');
  }

  async execute(command: VoteDataCommand) {
    const { caller, collectionId, dataSlug, vote } = command;
    try {
      const collection = await this.collectionRepository.findById(collectionId);
      if (!collection) throw 'Collection does not exist';
      if (!collection.voting.enabled)
        throw 'Voting is not enabled for this collection';
      if (collection.voting.options.length < vote) throw 'Invalid vote option';
      let updatedCollection;
      if (collection.voting.votes && collection.voting.votes[dataSlug]) {
        updatedCollection = await this.collectionRepository.updateById(
          collectionId,
          {
            voting: {
              ...collection.voting,
              votes: {
                ...collection.voting.votes,
                [dataSlug]: {
                  ...collection.voting.votes[dataSlug],
                  [caller.id]: vote,
                },
              },
            },
          },
        );
      } else {
        updatedCollection = await this.collectionRepository.updateById(
          collectionId,
          {
            voting: {
              ...collection.voting,
              votes: {
                ...collection.voting.votes,
                [dataSlug]: {
                  [caller.id]: vote,
                },
              },
            },
          },
        );
      }
      //   this.eventBus.publish(
      //     new DataUpatedEvent(
      //       collection,
      //       data,
      //       collection.data[dataSlug],
      //       caller,
      //     ),
      //   );
      return await await this.queryBus.execute(
        new GetPrivateViewCollectionQuery(collection.slug, updatedCollection),
      );
    } catch (err) {
      this.logger.error(
        `Failed updating data in collection with collection Id ${collectionId} with error ${err.message}`,
      );
      throw new InternalServerErrorException(
        `Failed updating data in collection to collection Id ${collectionId} with error ${err.message}`,
      );
    }
  }
}
