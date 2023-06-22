import { CreateSubscriptionToEventDto } from 'src/collection/dto/v2/subcription.dto';

export class SubscribeToEventCommand {
  constructor(
    public readonly collectionSlug: string,
    public readonly createSubscriptionDto: CreateSubscriptionToEventDto,
  ) {}
}

export class SendEventToSubscribersCommand {
  constructor(
    public readonly collectionId: string,
    public readonly eventName: 'dataAdded' | 'dataUpdated' | 'dataDeleted',
    public readonly data: any,
  ) {}
}
