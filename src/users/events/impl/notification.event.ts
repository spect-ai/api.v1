import { Circle } from 'src/circle/model/circle.model';
import { Diff, MappedItem } from 'src/common/interfaces';

export type NotifRef = {
  id: string;
  refType: 'user' | 'circle' | 'collection';
};
export class NotificationEventV2 {
  constructor(
    public readonly content: string,
    public readonly avatar: string,
    public readonly redirect: string,
    public readonly timestamp: Date,
    public readonly recipients: string[],
  ) {}
}

export class SingleNotificationEvent {
  constructor(
    public readonly content: string,
    public readonly avatar: string,
    public readonly redirect: string,
    public readonly timestamp: Date,
    public readonly recipients: string[],
  ) {}
}

export class SingleEmailNotificationEvent {
  constructor(
    public readonly content: string,
    public readonly subject: string,
    public readonly redirectUrl: string,
    public readonly recipient: string,
  ) {}
}
