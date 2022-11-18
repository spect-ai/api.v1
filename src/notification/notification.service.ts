import { Injectable } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Collection } from 'src/collection/model/collection.model';
import { GetMultipleCollectionsQuery } from 'src/collection/queries';
import { MailService } from 'src/mail/mail.service';
import { GetMultipleUsersByFilterQuery } from 'src/users/queries/impl';

@Injectable()
export class NotificationService {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
    private readonly mailService: MailService,
  ) {}

  async sendWeeklyOpportunityDigest(caller: string) {
    const collections = (await this.queryBus.execute(
      new GetMultipleCollectionsQuery({
        isAnOpportunity: true,
      }),
    )) as Collection[];
    const users = await this.queryBus.execute(
      new GetMultipleUsersByFilterQuery(
        {
          email: {
            $exists: true,
          },
        },
        caller,
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
      user.skills?.forEach((skill) => {
        if (!userToCollectionMap[user.id]) {
          userToCollectionMap[user.id] = [];
        }
        userToCollectionMap[user.id].push(...skillToCollectionMap[skill]);
      });
    }
    for (const user of users) {
      const collectionSet = new Set(userToCollectionMap[user.id]);
      const collections = Array.from(collectionSet) as Collection[];
      let opportunityDigest = '';
      for (const collection of collections) {
        opportunityDigest =
          opportunityDigest +
          `<h2>${collection.name}</h2>
        <button
          style="
            background-color: #ecdef3;
            border-color: white;
            width: 6rem;
            height: 2rem;
            border-radius: 0.5rem;
            color: #ae5fe2;
            font-weight: bold;
            cursor: pointer;
          "
          onclick="window.location.href='https://stackoverflow.com/questions/2906582/how-do-i-create-an-html-button-that-acts-like-a-link'"
        >
          Apply
        </button>`;
      }

      const mail = {
        to: `${user.email}`,
        from: {
          name: 'Team Spect',
          email: process.env.NOTIFICATION_EMAIL,
        }, // Fill it with your validated email on SendGrid account
        html: `<h1>Your curated opportunities are here!</h1>
        <div class="opportunities">
          <div class="opportunity">
            ${opportunityDigest}
          </div>
          </div>`,
      };

      await this.mailService.send(mail);
    }

    return true;
  }
}
