import { CommandHandler, ICommandHandler, QueryBus } from '@nestjs/cqrs';
import { GetChangelogCommand } from '../impl/get-changelog.command';
import { GetCollectionBySlugQuery } from 'src/collection/queries';
import { Collection } from 'src/collection/model/collection.model';

@CommandHandler(GetChangelogCommand)
export class GetChangelogCommandHandler
  implements ICommandHandler<GetChangelogCommand>
{
  constructor(private readonly queryBus: QueryBus) {}

  async execute() {
    console.log({ slug: process.env.CHANGELOG_SLUG });
    const changelog_collection: Collection = await this.queryBus.execute(
      new GetCollectionBySlugQuery(process.env.CHANGELOG_SLUG),
    );
    if (!changelog_collection?.data) {
      throw new Error('Changelog collection not found');
    }
    // return the last data
    return Object.values(changelog_collection.data)[
      Object.values(changelog_collection.data).length - 1
    ];
  }
}
