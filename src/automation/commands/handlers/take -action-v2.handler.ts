import { Injectable } from '@nestjs/common';
import {
  CommandBus,
  CommandHandler,
  EventBus,
  ICommandHandler,
  QueryBus,
} from '@nestjs/cqrs';
import { Circle } from 'src/circle/model/circle.model';
import { GetCircleByIdQuery } from 'src/circle/queries/impl';
import { Collection } from 'src/collection/model/collection.model';
import {
  GetCollectionByFilterQuery,
  GetCollectionBySlugQuery,
} from 'src/collection/queries';
import { DiscordService } from 'src/common/discord.service';
import { MappedItem } from 'src/common/interfaces';
import { LoggingService } from 'src/logging/logging.service';
import { MailService } from 'src/mail/mail.service';
import { EmailGeneratorService } from 'src/notification/email-generatr.service';
import { GetProfileQuery } from 'src/users/queries/impl';
import {
  CreateCardActionCommand,
  CreateDiscordChannelActionCommand,
  GiveDiscordRoleActionCommand,
  GiveRoleActionCommand,
  SendEmailActionCommand,
  StartVotingPeriodActionCommand,
} from '../impl/take-action-v2.command';
import { v4 as uuidv4 } from 'uuid';
import { AddDataUsingAutomationCommand } from 'src/collection/commands';
import { StartVotingPeriodCommand } from 'src/collection/commands/data/impl/vote-data.command';
import { JoinedCircleEvent } from 'src/circle/events/impl';

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
    const collection = await this.queryBus.execute(
      new GetCollectionBySlugQuery(relevantIds.collectionSlug),
    );
    if (!collection) {
      throw new Error('No collection found for the given slug');
    }

    const userId = collection.dataOwner[relevantIds.dataSlug];
    const user = await this.queryBus.execute(
      new GetProfileQuery(
        {
          _id: userId,
        },
        userId,
      ),
    );

    if (!user) {
      throw new Error('No user found for the given id');
    }

    return {
      circle,
      collection,
      user,
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
    try {
      const { action, caller, relevantIds } = command;
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
        try {
          const html = this.emailGeneratorService.generateEmailWithMessage(
            action.data.message,
            `https://circles.spect.network`,
            circle,
          );
          const mail = {
            to: `${email}`,
            from: {
              name: 'Spect Notifications',
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

      return updatesContainer;
    } catch (err) {
      this.logger.error(err);
    }
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
    const { action, caller, updatesContainer, relevantIds } = command;
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
      const { circle, collection, user } =
        await this.commonActionService.getCircleCollectionUsersFromRelevantIds(
          circleId,
          relevantIds,
        );

      await this.discordService.giveRolesToUser(
        circle.discordGuildId,
        user.discordId,
        roles,
      );

      return updatesContainer;
    } catch (err) {
      this.logger.error(err);
    }
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
      const { circle, collection, user } =
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

      const usersToAdd = [];
      if (action.data.addResponder) {
        if (user.discordId) {
          usersToAdd.push(user.discordId);
        }
      }

      if (channelName)
        await this.discordService.createChannel(
          circle.discordGuildId,
          channelName,
          action.data.channelCategory.value,
          action.data.isPrivate,
          rolesToAdd,
          usersToAdd,
        );

      return updatesContainer;
    } catch (err) {
      this.logger.error(err);
    }
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
      const data = {};
      for (const value of action.data.values) {
        if (value.type === 'default') {
          data[value.default.field.value] = value.default.value;
        } else if (value.type === 'mapping') {
          data[value.mapping.to.value] =
            fromCollection.data[relevantIds.dataSlug][value.mapping.from.value];
        }
      }

      await this.commandBus.execute(
        new AddDataUsingAutomationCommand(
          data,
          action.data.selectedCollection.value,
        ),
      );

      return updatesContainer;
    } catch (err) {
      this.logger.error(err);
    }
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
    this.logger.setContext(CreateCardActionCommandHandler.name);
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
      return updatesContainer;
    } catch (err) {
      this.logger.error(err);
    }
  }
}
