import { Injectable } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { User } from 'src/users/model/users.model';
import { GetCollectionBySlugQuery } from '../queries';

@Injectable()
export class WhitelistService {
  constructor(private readonly queryBus: QueryBus) {}

  async isWhitelisted(isFor: string, caller?: User) {
    const collection = await this.queryBus.execute(
      new GetCollectionBySlugQuery('c6270b30-a25f-4b46-a563-a3d674913604'),
    );

    for (const data of Object.values(collection.data)) {
      if (
        data?.['EthAddress']?.toLowerCase() ===
          caller.ethAddress?.toLowerCase() &&
        data?.['Whitelisted For'] === isFor
      ) {
        return true;
      }
    }

    return false;
  }
}
