import { Injectable } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { Collection } from 'mongoose';
import { User } from 'src/users/model/users.model';
import {
  GetCollectionByFilterQuery,
  GetCollectionByIdQuery,
  GetCollectionBySlugQuery,
} from '../queries';

@Injectable()
export class WhitelistService {
  constructor(private readonly queryBus: QueryBus) {}

  async isWhitelisted(isFor: string, caller?: User) {
    console.log({ caller: caller?.id });
    const collection = await this.queryBus.execute(
      new GetCollectionBySlugQuery('c6270b30-a25f-4b46-a563-a3d674913604'),
    );

    console.log({ data: collection.data });

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
