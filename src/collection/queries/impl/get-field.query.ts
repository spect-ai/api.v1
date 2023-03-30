import { Collection } from 'src/collection/model/collection.model';

export class GetNextFieldQuery {
  constructor(
    public readonly callerId: string,
    public readonly callerIdType: 'userId' | 'discordId',
    public readonly slug?: string,
    public readonly discordChannelId?: string,
    public readonly collection?: Collection,
  ) {}
}
