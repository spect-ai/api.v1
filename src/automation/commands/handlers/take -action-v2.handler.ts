import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler, QueryBus } from '@nestjs/cqrs';
import { Circle } from 'src/circle/model/circle.model';
import { GetCircleByIdQuery } from 'src/circle/queries/impl';
import { Collection } from 'src/collection/model/collection.model';
import { GetCollectionBySlugQuery } from 'src/collection/queries';
import { MappedItem } from 'src/common/interfaces';
import { LoggingService } from 'src/logging/logging.service';
import { MailService } from 'src/mail/mail.service';
import { EmailGeneratorService } from 'src/notification/email-generatr.service';
import { GetProfileQuery } from 'src/users/queries/impl';
import {
  GiveRoleActionCommand,
  SendEmailActionCommand,
} from '../impl/take-action-v2.command';

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
    console.log({ userId });
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

    try {
      if (!user.email) return;
      const html = this.emailGeneratorService.generateEmailWithMessage(
        action.data.message,
        `https://circles.spect.network`,
        user,
        circle,
      );
      const mail = {
        to: `${user.email}`,
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
}

@CommandHandler(GiveRoleActionCommand)
export class GiveRoleActionCommandHandler
  implements ICommandHandler<GiveRoleActionCommand>
{
  constructor(
    private readonly logger: LoggingService,
    private readonly queryBus: QueryBus,
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

      return updatesContainer;
    } catch (err) {
      this.logger.error(err);
    }
  }
}
