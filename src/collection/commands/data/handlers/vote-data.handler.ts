import { Injectable, InternalServerErrorException } from '@nestjs/common';
import {
  CommandBus,
  CommandHandler,
  EventBus,
  ICommandHandler,
  QueryBus,
} from '@nestjs/cqrs';
import { CollectionRepository } from 'src/collection/collection.repository';
import { LoggingService } from 'src/logging/logging.service';
import { GetPrivateViewCollectionQuery } from 'src/collection/queries';
import {
  EndVotingPeriodCommand,
  StartVotingPeriodCommand,
  VoteDataCommand,
} from '../impl/vote-data.command';
import { GetCircleByIdQuery } from 'src/circle/queries/impl';
import { UpdateCircleCommand } from 'src/circle/commands/impl/update-circle.command';
import { defaultCircleRoles } from 'src/constants';
import { VotingStartedEvent, VotingEndedEvent } from 'src/collection/events';
import { Collection } from 'src/collection/model/collection.model';
import { MappedItem } from 'src/common/interfaces';
import { Activity } from 'src/collection/types/types';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ActivityOnVoting {
  getActivity(
    collection: Collection,
    dataSlug: string,
    caller: string,
    action: 'start' | 'end',
  ): {
    dataActivities: MappedItem<MappedItem<Activity>>;
    dataActivityOrder: MappedItem<string[]>;
  } {
    const activityId = uuidv4();
    let content, ref;
    const dataType = 'Voting period';
    if (caller) {
      content = `${action}ed ${dataType}`;
      ref = {
        actor: {
          id: caller,
          type: 'user',
        },
      };
    } else {
      content = `${dataType} ${action}ed`;
    }

    return {
      dataActivities: {
        ...(collection.dataActivities || {}),
        [dataSlug]: {
          ...((collection.dataActivities || {})?.[dataSlug] || {}),
          [activityId]: {
            content,
            ref,
            timestamp: new Date(),
            comment: false,
          },
        },
      },
      dataActivityOrder: {
        ...(collection.dataActivityOrder || {}),
        [dataSlug]: [...collection.dataActivityOrder?.[dataSlug], activityId],
      },
    } as any;
  }
}

@CommandHandler(VoteDataCommand)
export class VoteDataCommandHandler
  implements ICommandHandler<VoteDataCommand>
{
  constructor(
    private readonly collectionRepository: CollectionRepository,
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
    private readonly logger: LoggingService,
  ) {
    this.logger.setContext('UpdateDataCommandHandler');
  }

  async execute(command: VoteDataCommand) {
    const { caller, collectionId, dataSlug, vote } = command;
    try {
      const collection = await this.collectionRepository.findById(collectionId);
      if (!collection) throw 'Collection does not exist';
      if (!collection.voting.periods[dataSlug]?.active)
        throw 'Voting is not active for this data';
      if (collection.voting.options.length < vote) throw 'Invalid vote option';
      const circle = await this.queryBus.execute(
        new GetCircleByIdQuery(collection.parents[0]),
      );
      if (!circle) throw 'Circle does not exist';
      const updates = {};
      if (!circle.members.includes(caller.id)) {
        updates['members'] = [...circle.members, caller.id];
        updates['memberRoles'] = {
          ...circle.memberRoles,
          [caller.id]: ['voter'],
        };
      } else {
        if (!circle.memberRoles[caller.id].includes('voter')) {
          updates['memberRoles'] = {
            ...circle.memberRoles,
            [caller.id]: [...circle.memberRoles[caller.id], 'voter'],
          };
        }
      }
      if (!Object.keys(circle.roles)?.includes('voter')) {
        updates['roles'] = {
          ...circle.roles,
          voter: defaultCircleRoles['voter'],
        };
      }
      await this.commandBus.execute(
        new UpdateCircleCommand(circle.id, updates, caller.id),
      );
      let updatedCollection;
      if (
        collection.voting.periods &&
        collection.voting.periods[dataSlug]?.votes
      ) {
        updatedCollection = await this.collectionRepository.updateById(
          collectionId,
          {
            voting: {
              ...collection.voting,
              periods: {
                ...collection.voting.periods,
                [dataSlug]: {
                  ...(collection.voting?.periods?.[dataSlug] || {}),
                  votes: {
                    ...(collection.voting?.periods?.[dataSlug]?.votes || {}),
                    [caller.id]: vote,
                  },
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
              periods: {
                ...(collection.voting?.periods || {}),
                [dataSlug]: {
                  ...(collection.voting?.periods?.[dataSlug] || {}),
                  votes: {
                    [caller.id]: vote,
                  },
                },
              },
            },
          },
        );
      }

      return await await this.queryBus.execute(
        new GetPrivateViewCollectionQuery(collection.slug, updatedCollection),
      );
    } catch (err) {
      this.logger.error(
        `Failed updating data in collection with collection Id ${collectionId} with error ${err}`,
      );
      throw new InternalServerErrorException(
        `Failed updating data in collection to collection Id ${collectionId} with error ${err}`,
      );
    }
  }
}

@CommandHandler(StartVotingPeriodCommand)
export class StartVotingPeriodCommandHandler
  implements ICommandHandler<StartVotingPeriodCommand>
{
  constructor(
    private readonly collectionRepository: CollectionRepository,
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
    private readonly eventBus: EventBus,
    private readonly logger: LoggingService,
    private readonly activityOnVoting: ActivityOnVoting,
  ) {
    this.logger.setContext('StartVotingPeriodCommandHandler');
  }

  async execute(command: StartVotingPeriodCommand) {
    const { caller, collectionId, dataSlug, startVotingPeriodRequestDto } =
      command;
    try {
      const collection = await this.collectionRepository.findById(collectionId);
      if (!collection) throw 'Collection does not exist';
      if (!collection.voting.enabled)
        throw 'Voting is not enabled for this collection';
      if (
        collection.voting.periods &&
        collection.voting.periods[dataSlug]?.active
      )
        throw 'Voting already started for this data';

      const { dataActivities, dataActivityOrder } =
        this.activityOnVoting.getActivity(
          collection,
          dataSlug,
          caller?.id,
          'start',
        );

      const updatedCollection = await this.collectionRepository.updateById(
        collectionId,
        {
          voting: {
            ...collection.voting,
            periods: {
              ...(collection.voting?.periods || {}),
              [dataSlug]: {
                active: true,
                options: collection.voting.options,
                votingType: collection.voting.votingType,
                message: collection.voting.message,
                votesArePublic: collection.voting.votesArePublic,
                votesAreWeightedByTokens:
                  collection.voting.votesAreWeightedByTokens,
                endsOn: startVotingPeriodRequestDto?.endsOn,
                startedOn: new Date(),
                snapshot: {
                  endsOn: startVotingPeriodRequestDto?.endsOn,
                  onSnapshot: startVotingPeriodRequestDto?.postOnSnapshot,
                  space: startVotingPeriodRequestDto?.space,
                  proposalId: startVotingPeriodRequestDto?.proposalId,
                },
                votes: {},
              },
            },
          },
          dataActivities,
          dataActivityOrder,
        },
      );

      this.eventBus.publish(
        new VotingStartedEvent(
          collection,
          startVotingPeriodRequestDto,
          dataSlug,
          caller,
        ),
      );

      return await await this.queryBus.execute(
        new GetPrivateViewCollectionQuery(collection.slug, updatedCollection),
      );
    } catch (err) {
      this.logger.error(
        `Failed starting voting period in collection with collection Id ${collectionId} with error ${err}`,
      );
      throw new InternalServerErrorException(
        `Failed starting voting period in collection to collection Id ${collectionId} with error ${err}`,
      );
    }
  }
}

@CommandHandler(EndVotingPeriodCommand)
export class EndVotingPeriodCommandHandler
  implements ICommandHandler<EndVotingPeriodCommand>
{
  constructor(
    private readonly collectionRepository: CollectionRepository,
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
    private readonly eventBus: EventBus,
    private readonly logger: LoggingService,
    private readonly activityOnVoting: ActivityOnVoting,
  ) {
    this.logger.setContext('EndVotingPeriodCommandHandler');
  }

  async execute(command: EndVotingPeriodCommand) {
    const { caller, collectionId, dataSlug } = command;
    try {
      const collection = await this.collectionRepository.findById(collectionId);
      if (!collection) throw 'Collection does not exist';
      if (!collection.voting.enabled)
        throw 'Voting is not enabled for this collection';
      if (
        collection.voting.periods &&
        !collection.voting.periods[dataSlug]?.active
      )
        throw 'Voting already ended for this data';

      const { dataActivities, dataActivityOrder } =
        this.activityOnVoting.getActivity(
          collection,
          dataSlug,
          caller?.id,
          'end',
        );
      const updatedCollection = await this.collectionRepository.updateById(
        collectionId,
        {
          voting: {
            ...collection.voting,
            periods: {
              ...collection.voting.periods,
              [dataSlug]: {
                ...collection.voting.periods[dataSlug],
                active: false,
              },
            },
          },
          dataActivities,
          dataActivityOrder,
        },
      );

      if (!collection.voting.periods[dataSlug].snapshot.proposalId) {
        this.eventBus.publish(
          new VotingEndedEvent(collection, dataSlug, caller),
        );
      }
      return await await this.queryBus.execute(
        new GetPrivateViewCollectionQuery(collection.slug, updatedCollection),
      );
    } catch (err) {
      this.logger.error(
        `Failed ending voting period in collection with collection Id ${collectionId} with error ${err}`,
      );
      throw new InternalServerErrorException(
        `Failed ending voting period in collection to collection Id ${collectionId} with error ${err}`,
      );
    }
  }
}
