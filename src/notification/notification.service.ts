import { Injectable } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Circle } from 'src/circle/model/circle.model';
import { Collection } from 'src/collection/model/collection.model';
import { GetMultipleCollectionsQuery } from 'src/collection/queries';
import { MailService } from 'src/mail/mail.service';
import { User } from 'src/users/model/users.model';
import { GetMultipleUsersByFilterQuery } from 'src/users/queries/impl';
import { EmailGeneratorService } from './email-generatr.service';

@Injectable()
export class NotificationService {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
    private readonly mailService: MailService,
    private readonly emailGenerator: EmailGeneratorService,
  ) {}

  async sendWeeklyOpportunityDigest(caller: User) {
    const collections = (await this.queryBus.execute(
      new GetMultipleCollectionsQuery(
        {
          isAnOpportunity: true,
        },
        {
          parents: {
            name: 1,
          },
        },
      ),
    )) as Collection[];
    const users = await this.queryBus.execute(
      new GetMultipleUsersByFilterQuery(
        {
          email: {
            $exists: true,
          },
        },
        caller.id,
      ),
    );

    const skillToCollectionMap = {};
    for (const collection of collections) {
      collection.opportunityInfo.skills?.forEach((skill) => {
        if (!skillToCollectionMap[skill]) {
          skillToCollectionMap[skill] = [];
        }
        skillToCollectionMap[skill].push(collection);
      });
    }
    const userToCollectionMap = {};
    for (const user of users) {
      userToCollectionMap[user._id.toString()] = [];

      user.skillsV2?.forEach((skill) => {
        userToCollectionMap[user._id.toString()].push(
          ...(skillToCollectionMap[skill.category] || []),
        );
      });
      if (userToCollectionMap[user._id.toString()].length > 0) {
        const html = this.emailGenerator.generateDigestEmail(
          userToCollectionMap[user._id.toString()],
          user,
        );
        const mail = {
          to: `${user.email}`,
          from: {
            name: 'Team Spect',
            email: process.env.NOTIFICATION_EMAIL,
          }, // Fill it with your validated email on SendGrid account
          html,
          subject: 'Your curated opportunities are here!',
        };

        const res = await this.mailService.send(mail);
      }
    }

    return true;
  }
}
