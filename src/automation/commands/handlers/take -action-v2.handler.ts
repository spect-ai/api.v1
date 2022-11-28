import { CommandHandler, ICommandHandler, QueryBus } from '@nestjs/cqrs';
import { Circle } from 'src/circle/model/circle.model';
import { GetCircleByIdQuery } from 'src/circle/queries/impl';
import { Collection } from 'src/collection/model/collection.model';
import { GetCollectionBySlugQuery } from 'src/collection/queries';
import { LoggingService } from 'src/logging/logging.service';
import { MailService } from 'src/mail/mail.service';
import { GetProfileQuery } from 'src/users/queries/impl';
import {
  GiveRoleActionCommand,
  SendEmailActionCommand,
} from '../impl/take-action-v2.command';

@CommandHandler(SendEmailActionCommand)
export class SendEmailActionCommandHandler
  implements ICommandHandler<SendEmailActionCommand>
{
  constructor(
    private readonly emailService: MailService,
    private readonly logger: LoggingService,
  ) {
    this.logger.setContext(SendEmailActionCommandHandler.name);
  }

  async execute(command: SendEmailActionCommand): Promise<any> {
    const { action, caller } = command;
    try {
      const mail = {
        to: `adityachakra16@gmail.com`,
        from: {
          name: 'Team Spect',
          email: process.env.NOTIFICATION_EMAIL,
        }, // Fill it with your validated email on SendGrid account
        content: action.data.message,
        subject: 'Your curated opportunities are here!',
      };
      await this.emailService.send(mail);
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
  ) {
    this.logger.setContext(GiveRoleActionCommandHandler.name);
  }

  async execute(command: GiveRoleActionCommand): Promise<any> {
    const { action, caller, dataContainer, updatesContainer, relevantIds } =
      command;
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
      if (!dataContainer[circleId]) {
        dataContainer[circleId] = await this.queryBus.execute(
          new GetCircleByIdQuery(circleId),
        );
        if (!dataContainer[circleId]) {
          throw new Error('No circle found for the given id');
        }
      }

      if (!dataContainer[relevantIds.collectionSlug]) {
        dataContainer[relevantIds.collectionSlug] = await this.queryBus.execute(
          new GetCollectionBySlugQuery(relevantIds.collectionSlug),
        );
        if (!dataContainer[relevantIds.collectionSlug]) {
          throw new Error('No collection found for the given id');
        }
      }
      const userId =
        dataContainer[relevantIds.collectionSlug].dataOwner[
          relevantIds.dataSlug
        ];
      if (!dataContainer[userId]) {
        dataContainer[userId] = await this.queryBus.execute(
          new GetProfileQuery(
            {
              _id: userId,
            },
            caller,
          ),
        );
        if (!dataContainer[userId]) {
          throw new Error('No user found for the given id');
        }
      }

      let newMemberRoles = [];
      if (
        dataContainer[circleId].memberRoles[
          dataContainer[userId]._id.toString()
        ]
      ) {
        newMemberRoles = [
          ...new Set([
            ...roles,
            ...(dataContainer[circleId].memberRoles[
              dataContainer[userId]._id.toString()
            ] || []),
          ]),
        ];
      } else {
        newMemberRoles = roles;
      }

      const memberRoles = {
        ...dataContainer[circleId].memberRoles,
        [dataContainer[userId]._id.toString()]: newMemberRoles,
      };
      const members = [...(dataContainer[circleId].members || []), userId];

      updatesContainer['circle'][circleId] = {
        ...(updatesContainer['circle'][circleId] || {}),
        memberRoles,
        members,
      };

      return updatesContainer;
    } catch (err) {
      this.logger.error(err);
    }
  }
}
