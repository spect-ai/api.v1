import { User } from 'src/users/model/users.model';
import { UserSubmittedApplication } from 'src/users/types/types';

export class AddItemCommand {
  constructor(
    public readonly caller: string,
    public readonly field:
      | 'bookmarks'
      | 'followingCircles'
      | 'followingUsers'
      | 'followers'
      | 'activeApplications'
      | 'pickedApplications'
      | 'rejectedApplications',
    public readonly item: string | UserSubmittedApplication,
    public readonly user?: User,
    public readonly userId?: string,
  ) {}
}
