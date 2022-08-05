import { User } from 'src/users/model/users.model';

export class MoveItemCommand {
  constructor(
    public readonly fieldFrom:
      | 'bookmarks'
      | 'followingCircles'
      | 'followingUsers'
      | 'followers'
      | 'activeApplications'
      | 'pickedApplications'
      | 'rejectedApplications',
    public readonly fieldTo:
      | 'bookmarks'
      | 'followingCircles'
      | 'followingUsers'
      | 'followers'
      | 'activeApplications'
      | 'pickedApplications'
      | 'rejectedApplications',
    public readonly item: string,
    public readonly user?: User,
    public readonly userId?: string,
  ) {}
}
