import { Injectable } from '@nestjs/common';
import {
  CommandBus,
  CommandHandler,
  EventBus,
  ICommandHandler,
  QueryBus,
} from '@nestjs/cqrs';
import { GetCircleByIdQuery } from 'src/circle/queries/impl';
import {
  GetCollectionByFilterQuery,
  GetCollectionBySlugQuery,
} from 'src/collection/queries';
import { DiscordService } from 'src/common/discord.service';
import { MappedItem } from 'src/common/interfaces';
import { LoggingService } from 'src/logging/logging.service';
import { MailService } from 'src/mail/mail.service';
import { EmailGeneratorService } from 'src/notification/email-generatr.service';
import {
  GetMultipleUsersByIdsQuery,
  GetProfileQuery,
  GetUserByFilterQuery,
} from 'src/users/queries/impl';
import {
  CreateCardActionCommand,
  CreateDiscordChannelActionCommand,
  GiveDiscordRoleActionCommand,
  GiveRoleActionCommand,
  PostOnDiscordActionCommand,
  SendEmailActionCommand,
  StartVotingPeriodActionCommand,
  CloseCardActionCommand,
  InitiatePendingPaymentActionCommand,
  CreateDiscordThreadCommand,
  PostOnDiscordThreadCommand,
} from '../impl/take-action-v2.command';
import {
  AddDataUsingAutomationCommand,
  AddMultipleDataUsingAutomationCommand,
  UpdateCollectionCommand,
  UpdateDataUsingAutomationCommand,
} from 'src/collection/commands';
import { StartVotingPeriodCommand } from 'src/collection/commands/data/impl/vote-data.command';
import { JoinedCircleEvent } from 'src/circle/events/impl';
import { AddPaymentsCommand } from 'src/circle/commands/payments/impl';
import { Collection } from 'src/collection/model/collection.model';

@Injectable()
export class CommonActionService {
  constructor(private readonly queryBus: QueryBus) {}

  async getCircleCollectionUsersFromRelevantIds(
    circleId: string,
    relevantIds: MappedItem<any>,
  ) {
    const circle = await this.queryBus.execute(
      new GetCircleByIdQuery(circleId),
    );
    if (!circle) throw new Error('Circle not found');
    const collection: Collection = await this.queryBus.execute(
      new GetCollectionBySlugQuery(relevantIds.collectionSlug),
    );
    if (!collection) {
      throw new Error('No collection found for the given slug');
    }

    let user;
    try {
      const userId = collection.dataOwner[relevantIds.dataSlug];
      user = await this.queryBus.execute(
        new GetProfileQuery(
          {
            _id: userId,
          },
          userId,
        ),
      );
    } catch (err) {
      console.log({ err });
    }

    let discordUserId;
    const discordField = Object.values(collection.properties).find(
      (property) => property.type === 'discord',
    );
    if (discordField) {
      discordUserId =
        collection.data[relevantIds.dataSlug][discordField.id]?.['id'];
    }
    console.log({ discordUserId });

    return {
      circle,
      collection,
      user,
      discordUserId,
    };
  }
}

@CommandHandler(SendEmailActionCommand)
export class SendEmailActionCommandHandler
  implements ICommandHandler<SendEmailActionCommand>
{
  constructor(
    private readonly emailService: MailService,
    private readonly logger: LoggingService,
    private readonly commonActionService: CommonActionService,
    private readonly emailGeneratorService: EmailGeneratorService,
  ) {
    this.logger.setContext(SendEmailActionCommandHandler.name);
  }

  async execute(command: SendEmailActionCommand): Promise<any> {
    console.log('SendEmailActionCommandHandler');
    const { action, caller, relevantIds, updatesContainer } = command;
    try {
      const circleId = action.data.circleId;
      if (!circleId) {
        throw new Error('No circleId provided in automation data');
      }
      if (!action.data.message) return;

      const { circle, collection, user } =
        await this.commonActionService.getCircleCollectionUsersFromRelevantIds(
          circleId,
          relevantIds,
        );

      let emails = [];
      for (const emailProperty of action.data.toEmailProperties) {
        emails = [
          ...emails,
          collection.data[relevantIds.dataSlug][emailProperty],
        ];
      }
      for (const email of emails) {
        if (!email) continue;
        console.log('Sending email to ', email);
        try {
          const html = this.emailGeneratorService.generateEmailWithMessage(
            action.data.message,
            `https://circles.spect.network`,
            circle,
          );
          const mail = {
            to: `${email}`,
            from: {
              name: `A message from ${circle.name ? circle.name : 'Spect'}`,
              email: process.env.NOTIFICATION_EMAIL,
            }, // Fill it with your validated email on SendGrid account
            html,
            subject: `You have a new notification from ${circle.name}`,
          };
          const res = await this.emailService.send(mail);
        } catch (err) {
          this.logger.error(err);
        }
      }
    } catch (err) {
      this.logger.error(err);
    }
    return updatesContainer;
  }
}

@CommandHandler(GiveRoleActionCommand)
export class GiveRoleActionCommandHandler
  implements ICommandHandler<GiveRoleActionCommand>
{
  constructor(
    private readonly logger: LoggingService,
    private readonly eventBus: EventBus,
    private readonly commonActionService: CommonActionService,
  ) {
    this.logger.setContext(GiveRoleActionCommandHandler.name);
  }

  async execute(command: GiveRoleActionCommand): Promise<any> {
    const { action, caller, updatesContainer, relevantIds } = command;
    try {
      console.log('GiveRoleActionCommandHandler');
      const circleId = action.data.circleId;
      if (!circleId) {
        throw new Error('No circleId provided in automation data');
      }
      if (!action.data.roles || typeof action.data.roles !== 'object') return;
      const roles = [];
      for (const [role, give] of Object.entries(action.data.roles)) {
        if (give) roles.push(role);
      }
      if (!roles || roles.length === 0) return;
      const { circle, collection, user } =
        await this.commonActionService.getCircleCollectionUsersFromRelevantIds(
          circleId,
          relevantIds,
        );
      if (!user) throw `No user found foound in GiveRoleActionCommand`;
      let newMemberRoles = [];
      if (circle.memberRoles[user._id.toString()]) {
        newMemberRoles = [
          ...new Set([
            ...roles,
            ...(circle.memberRoles[user._id.toString()] || []),
          ]),
        ];
      } else {
        newMemberRoles = roles;
      }

      const memberRoles = {
        ...circle.memberRoles,
        [user._id.toString()]: newMemberRoles,
      };

      if (!circle.members.includes(user._id.toString()))
        circle.members = [...(circle.members || []), user._id.toString()];

      updatesContainer['circle'][circleId] = {
        ...(updatesContainer['circle'][circleId] || {}),
        memberRoles,
        members: circle.members,
      };

      this.eventBus.publish(
        new JoinedCircleEvent(user._id.toString(), circleId, null),
      );
    } catch (err) {
      this.logger.error(err);
    }
    return updatesContainer;
  }
}

@CommandHandler(GiveDiscordRoleActionCommand)
export class GiveDiscordRoleActionCommandHandler
  implements ICommandHandler<GiveDiscordRoleActionCommand>
{
  constructor(
    private readonly logger: LoggingService,
    private readonly discordService: DiscordService,
    private readonly commonActionService: CommonActionService,
  ) {
    this.logger.setContext(GiveDiscordRoleActionCommandHandler.name);
  }

  async execute(command: GiveDiscordRoleActionCommand): Promise<any> {
    const { action, updatesContainer, relevantIds } = command;
    try {
      console.log('GiveDiscordRoleActionCommandHandler');
      const circleId = action.data.circleId;
      if (!circleId) {
        throw new Error('No circleId provided in automation data');
      }
      if (!action.data.roles || typeof action.data.roles !== 'object') return;
      const roles = [];
      for (const [role, give] of Object.entries(action.data.roles)) {
        if (give) roles.push(role);
      }
      if (!roles || roles.length === 0) return;
      const { circle, collection, discordUserId } =
        await this.commonActionService.getCircleCollectionUsersFromRelevantIds(
          circleId,
          relevantIds,
        );

      if (discordUserId) {
        await this.discordService.giveRolesToUser(
          circle.discordGuildId,
          roles,
          discordUserId,
        );
      } else {
        const discordField = Object.values(collection.properties).find(
          (property) => property.type === 'discord',
        );
        if (discordField) {
          const val = collection.data[relevantIds.dataSlug][discordField.id];
          let discordUsername, discordDiscriminator;
          if (typeof val === 'string') {
            const split = val.split('#');
            discordUsername = split[0];
            discordDiscriminator = split[1];
          } else if (typeof val === 'object') {
            discordUsername = val.username;
            discordDiscriminator = val.discriminator;
          }
          if (discordUsername && discordDiscriminator) {
            await this.discordService.giveRolesToUser(
              circle.discordGuildId,
              roles,
              null,
              discordUsername,
              discordDiscriminator,
            );
          }
        }
      }
    } catch (err) {
      this.logger.error(err);
    }
    return updatesContainer;
  }
}

@CommandHandler(CreateDiscordChannelActionCommand)
export class CreateDiscordChannelActionCommandHandler
  implements ICommandHandler<CreateDiscordChannelActionCommand>
{
  constructor(
    private readonly logger: LoggingService,
    private readonly discordService: DiscordService,
    private readonly queryBus: QueryBus,
    private readonly commonActionService: CommonActionService,
  ) {
    this.logger.setContext(CreateDiscordChannelActionCommandHandler.name);
  }

  async execute(command: CreateDiscordChannelActionCommand): Promise<any> {
    const { action, caller, updatesContainer, relevantIds } = command;
    try {
      console.log('CreateDiscordChannelActionCommandHandler');
      const circleId = action.data.circleId;
      if (!circleId) {
        throw new Error('No circleId provided in automation data');
      }
      const { circle, collection, discordUserId } =
        await this.commonActionService.getCircleCollectionUsersFromRelevantIds(
          circleId,
          relevantIds,
        );

      let channelName;
      if (
        action.data.channelNameType === 'value' &&
        action.data.channelName?.value
      ) {
        channelName = action.data.channelName?.value;
      } else if (
        action.data.channelNameType === 'mapping' &&
        action.data.channelName?.value
      ) {
        channelName =
          collection.data[relevantIds.dataSlug][action.data.channelName.value];
      }
      const rolesToAdd = [];
      if (action.data.rolesToAdd && typeof action.data.rolesToAdd === 'object')
        for (const [role, give] of Object.entries(action.data.rolesToAdd)) {
          if (give) rolesToAdd.push(role);
        }

      const usersToadd = [];
      let discordIdsToAdd = [] as any;

      if (action?.data?.stakeholdersToAdd?.length) {
        for (const propertyName of action.data.stakeholdersToAdd) {
          if (collection.properties[propertyName].type === 'user') {
            usersToadd.push(
              collection.data[relevantIds.dataSlug][propertyName]?.value,
            );
          } else if (
            collection.properties[propertyName].type === 'user[]' &&
            collection.data[relevantIds.dataSlug][propertyName]
          ) {
            usersToadd.push(
              ...collection.data[relevantIds.dataSlug][propertyName]?.map(
                (a) => a.value,
              ),
            );
          }
        }
        if (usersToadd?.length) {
          const users = await this.queryBus.execute(
            new GetMultipleUsersByIdsQuery(usersToadd),
          );
          if (users?.length)
            discordIdsToAdd = users
              .filter((u) => u.discordId)
              .map((u) => u.discordId);
        }
      }
      if (action.data.addResponder) {
        if (discordUserId) {
          discordIdsToAdd.push(discordUserId);
        }
      }

      if (channelName)
        await this.discordService.createChannel(
          circle.discordGuildId,
          channelName,
          action.data.channelCategory.value,
          action.data.isPrivate,
          rolesToAdd,
          discordIdsToAdd,
        );
    } catch (err) {
      this.logger.error(err);
    }
    return updatesContainer;
  }
}

@CommandHandler(CreateCardActionCommand)
export class CreateCardActionCommandHandler
  implements ICommandHandler<CreateCardActionCommand>
{
  constructor(
    private readonly logger: LoggingService,
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {
    this.logger.setContext(CreateCardActionCommandHandler.name);
  }

  async execute(command: CreateCardActionCommand): Promise<any> {
    const { action, caller, updatesContainer, relevantIds } = command;
    try {
      console.log('CreateCardActionCommandHandler');
      const fromCollection = await this.queryBus.execute(
        new GetCollectionByFilterQuery({
          slug: relevantIds.collectionSlug,
        }),
      );
      const toCollection = await this.queryBus.execute(
        new GetCollectionByFilterQuery({
          _id: action.data.selectedCollection?.value,
        }),
      );

      const data = {};
      let milestoneFields = {} as { [key: string]: string[][] };
      for (const value of action.data.values) {
        if (value.type === 'default') {
          data[value.default.field.value] = value.default.value;
        } else if (value.type === 'mapping') {
          if (
            value.mapping.from.data?.fieldType === 'milestone' &&
            ['shortText', 'longText', 'date', 'reward'].includes(
              value.mapping.from.data?.type,
            )
          ) {
            if (!milestoneFields[value.mapping.from.data?.fieldName])
              milestoneFields = {
                ...milestoneFields,
                [value.mapping.from.data?.fieldName]: [],
              };
            milestoneFields[value.mapping.from.data?.fieldName].push([
              value.mapping.from.data?.subFieldName,
              value.mapping.to.value,
            ]);
          } else
            data[value.mapping.to.value] =
              fromCollection.data[relevantIds.dataSlug][
                value.mapping.from.value
              ];
        } else if (value.type === 'responder') {
          let dataOwner;
          try {
            dataOwner = await this.queryBus.execute(
              new GetProfileQuery(
                {
                  _id: fromCollection.dataOwner[relevantIds.dataSlug],
                },
                fromCollection.dataOwner[relevantIds.dataSlug],
              ),
            );
          } catch (err) {
            this.logger.error(err);
            continue;
          }
          if (toCollection.properties[value.mapping.to.value].type === 'user') {
            data[value.mapping.to.value] = {
              label: dataOwner.username,
              value: dataOwner._id.toString(),
            };
          } else if (
            toCollection.properties[value.mapping.to.value].type === 'user[]'
          ) {
            data[value.mapping.to.value] = [
              ...(data[value.mapping.to.value] || []),
              {
                label: dataOwner.username,
                value: dataOwner._id.toString(),
              },
            ];
          } else if (
            toCollection.properties[value.mapping.to.value].type ===
            'ethAddress'
          ) {
            data[value.mapping.to.value] = dataOwner.ethAddress;
          }
        }
      }

      const allData = [];
      for (const [milestoneField, fields] of Object.entries(milestoneFields)) {
        for (const milestone of fromCollection.data[relevantIds.dataSlug][
          milestoneField
        ]) {
          const d = { ...data };
          for (const field of fields) {
            if (milestone[field[0]]) d[field[1]] = milestone[field[0]];
          }
          allData.push(d);
        }
      }

      console.log({ allData });
      if (allData.length === 0) allData.push(data);
      await this.commandBus.execute(
        new AddMultipleDataUsingAutomationCommand(
          allData,
          action.data.selectedCollection.value,
        ),
      );
    } catch (err) {
      this.logger.error(err);
    }
    return updatesContainer;
  }
}

@CommandHandler(PostOnDiscordActionCommand)
export class PostOnDiscordActionCommandHandler
  implements ICommandHandler<PostOnDiscordActionCommand>
{
  constructor(
    private readonly logger: LoggingService,
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly discordService: DiscordService,
  ) {
    this.logger.setContext(PostOnDiscordActionCommandHandler.name);
  }

  async execute(command: PostOnDiscordActionCommand): Promise<any> {
    const { action, updatesContainer, relevantIds } = command;
    try {
      console.log('PostOnDiscordActionCommandHandler');
      const collection = await this.queryBus.execute(
        new GetCollectionByFilterQuery({
          slug: relevantIds.collectionSlug,
        }),
      );

      const fields = action.data.fields
        ?.map((f) => ({
          name: collection.properties?.[f.value]?.name,
          value: collection?.data?.[relevantIds.dataSlug]?.[f.value],
          type: collection.properties?.[f.value]?.type,
        }))
        .filter((f) => {
          if (f.type === 'singleSelect') {
            return f.value?.value;
          } else if (f.type === 'multiSelect') {
            return f.value?.some((v) => v.value);
          }
          return f.value !== undefined && f.value !== null && f.value !== '';
        });

      await this.discordService.postData(
        action.data.channel.value,
        action.data.message,
        action.data.url + relevantIds.dataSlug,
        fields,
      );
    } catch (err) {
      this.logger.error(err);
    }
    return updatesContainer;
  }
}

@CommandHandler(CreateDiscordThreadCommand)
export class CreateDiscordThreadCommandHandler
  implements ICommandHandler<PostOnDiscordActionCommand>
{
  constructor(
    private readonly logger: LoggingService,
    private readonly commandBus: CommandBus,
    private readonly commonActionService: CommonActionService,
    private readonly discordService: DiscordService,
    private readonly queryBus: QueryBus,
  ) {
    this.logger.setContext(PostOnDiscordActionCommandHandler.name);
  }

  async execute(command: CreateDiscordThreadCommand): Promise<any> {
    const { action, updatesContainer, relevantIds, caller } = command;
    try {
      const circleId = action.data.circleId;
      if (!circleId) {
        throw new Error('No circleId provided in automation data');
      }
      const { circle, collection, discordUserId } =
        await this.commonActionService.getCircleCollectionUsersFromRelevantIds(
          circleId,
          relevantIds,
        );

      let threadName;
      if (
        action.data.threadNameType === 'value' &&
        action.data.threadName?.value
      ) {
        threadName = action.data.threadName?.value;
      } else if (
        action.data.threadNameType === 'mapping' &&
        action.data.threadName?.value
      ) {
        threadName =
          collection.data[relevantIds.dataSlug][action.data.threadName.value];
      }
      const rolesToAdd = [];
      if (action.data.rolesToAdd && typeof action.data.rolesToAdd === 'object')
        for (const [role, give] of Object.entries(action.data.rolesToAdd)) {
          if (give) rolesToAdd.push(role);
        }

      const usersToadd = [];
      let discordIdsToAdd = [] as any;

      if (action?.data?.stakeholdersToAdd?.length) {
        for (const propertyName of action.data.stakeholdersToAdd) {
          if (collection.properties[propertyName].type === 'user') {
            usersToadd.push(
              collection.data[relevantIds.dataSlug][propertyName]?.value,
            );
          } else if (
            collection.properties[propertyName].type === 'user[]' &&
            collection.data[relevantIds.dataSlug][propertyName]
          ) {
            usersToadd.push(
              ...collection.data[relevantIds.dataSlug][propertyName]?.map(
                (a) => a.value,
              ),
            );
          }
        }
        if (usersToadd?.length) {
          const users = await this.queryBus.execute(
            new GetMultipleUsersByIdsQuery(usersToadd),
          );
          if (users?.length)
            discordIdsToAdd = users
              .filter((u) => u.discordId)
              .map((u) => u.discordId);
        }
      }
      if (action.data.addResponder) {
        if (discordUserId) {
          discordIdsToAdd.push(discordUserId);
        }
      }
      const threadId = await this.discordService.createThread(
        circle.discordGuildId,
        threadName,
        action.data.selectedChannel.value,
        action.data.isPrivate,
        discordIdsToAdd,
        rolesToAdd,
        `Gm folks, this thread is linked to a ${
          collection.collectionType === 0 ? 'response' : 'card'
        } on ${collection.name}`,
        `https://circles.spect.network/${circle.slug}/r/${collection.slug}?cardSlug=${relevantIds.dataSlug}`,
      );
      await this.commandBus.execute(
        new UpdateCollectionCommand(
          {
            discordThreadRef: {
              ...collection.discordThreadRef,
              [relevantIds.dataSlug]: {
                threadId: threadId,
                channelId: action.data.selectedChannel.value,
                guildId: circle.discordGuildId,
                private: action.data.isPrivate,
              },
            },
          },
          caller,
          collection._id.toString(),
        ),
      );
    } catch (err) {
      this.logger.error(err);
    }
    return updatesContainer;
  }
}

@CommandHandler(CloseCardActionCommand)
export class CloseCardActionCommandHandler
  implements ICommandHandler<CloseCardActionCommand>
{
  constructor(
    private readonly logger: LoggingService,
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly commonActionService: CommonActionService,
  ) {
    this.logger.setContext(CloseCardActionCommand.name);
  }

  async execute(command: CloseCardActionCommand): Promise<any> {
    const { action, caller, updatesContainer, relevantIds } = command;
    try {
      const collection = await this.queryBus.execute(
        new GetCollectionBySlugQuery(relevantIds.collectionSlug),
      );
      if (!collection) {
        throw `Collection with slug ${relevantIds.collectionSlug} not found`;
      }
      await this.commandBus.execute(
        new UpdateDataUsingAutomationCommand(
          {
            __cardStatus__: 'closed',
          },
          collection?.id,
          relevantIds.dataSlug,
        ),
      );
    } catch (err) {
      this.logger.error(err);
    }
    return updatesContainer;
  }
}

@CommandHandler(PostOnDiscordThreadCommand)
export class PostOnDiscordThreadCommandHandler
  implements ICommandHandler<PostOnDiscordThreadCommand>
{
  constructor(
    private readonly logger: LoggingService,
    private readonly discordService: DiscordService,
    private readonly queryBus: QueryBus,
    private readonly commonActionService: CommonActionService,
  ) {
    this.logger.setContext(PostOnDiscordThreadCommandHandler.name);
  }

  async execute(command: PostOnDiscordThreadCommand): Promise<any> {
    const { action, caller, updatesContainer, relevantIds } = command;
    console.log('PostOnDiscordThreadCommand');
    try {
      const circleId = action.data.circleId;
      if (!circleId) {
        throw new Error('No circleId provided in automation data');
      }
      if (!action.data.message) throw 'Message is required';

      const { circle, collection, user } =
        await this.commonActionService.getCircleCollectionUsersFromRelevantIds(
          circleId,
          relevantIds,
        );

      const threadRef =
        collection.discordThreadRef &&
        collection.discordThreadRef[relevantIds.dataSlug];
      if (!threadRef) {
        this.logger.error('No thread ref found');
        return updatesContainer;
      }

      const fields = action.data.fields
        ?.map((f) => ({
          name: collection.properties?.[f.value]?.name,
          value: collection?.data?.[relevantIds.dataSlug]?.[f.value],
          type: collection.properties?.[f.value]?.type,
        }))
        .filter((f) => {
          if (f.type === 'singleSelect') {
            return f.value?.value !== undefined;
          } else if (f.type === 'multiSelect') {
            return f.value?.some((v) => v.value !== undefined);
          }
          return f.value !== undefined && f.value !== null && f.value !== '';
        });

      const res = await this.discordService.postData(
        threadRef.threadId,
        action.data.message,
        `https://circles.spect.network/${circle.slug}/r/${collection.slug}?cardSlug=${relevantIds.dataSlug}`,
        fields,
      );
    } catch (err) {
      this.logger.error(err);
    }
    return updatesContainer;
  }
}

@CommandHandler(InitiatePendingPaymentActionCommand)
export class InitiatePendingPaymentActionCommandHandler
  implements ICommandHandler<InitiatePendingPaymentActionCommand>
{
  constructor(
    private readonly logger: LoggingService,
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {
    this.logger.setContext(InitiatePendingPaymentActionCommandHandler.name);
  }

  async execute(command: InitiatePendingPaymentActionCommand): Promise<any> {
    const { action, caller, updatesContainer, relevantIds } = command;
    try {
      if (
        !action.data.initiate ||
        !action.data.rewardField ||
        !action.data.payeeField
      ) {
        throw `Initiate, rewardField and payeeField are required`;
      }

      const collection = await this.queryBus.execute(
        new GetCollectionByFilterQuery({
          slug: relevantIds.collectionSlug,
        }),
      );

      const botUser = await this.queryBus.execute(
        new GetProfileQuery(
          {
            username: 'Stu, the Spect Bot',
          },
          '',
        ),
      );

      await this.commandBus.execute(
        new AddPaymentsCommand(
          collection?.parents?.[0],
          {
            collectionId: collection.id,
            dataSlugs: [relevantIds.dataSlug],
          },
          botUser,
        ),
      );
    } catch (err) {
      this.logger.error(err);
    }
    return updatesContainer;
  }
}

@CommandHandler(StartVotingPeriodActionCommand)
export class StartVotingPeriodActionCommandHandler
  implements ICommandHandler<StartVotingPeriodActionCommand>
{
  constructor(
    private readonly logger: LoggingService,
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {
    this.logger.setContext(StartVotingPeriodActionCommandHandler.name);
  }

  async execute(command: StartVotingPeriodActionCommand): Promise<any> {
    const { action, caller, updatesContainer, relevantIds } = command;
    try {
      console.log('StartVotingPeriodActionCommandHandler');
      const fromCollection = await this.queryBus.execute(
        new GetCollectionByFilterQuery({
          slug: relevantIds.collectionSlug,
        }),
      );
      await this.commandBus.execute(
        new StartVotingPeriodCommand(
          relevantIds.dataSlug,
          fromCollection._id.toString(),
        ),
      );
    } catch (err) {
      this.logger.error(err);
    }
    return updatesContainer;
  }
}
