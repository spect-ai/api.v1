/* eslint-disable prettier/prettier */
import { User } from 'src/users/model/users.model';

export class DuplicateCircleCommand {
  constructor(
    public readonly circleSlug: string,
    public readonly caller: User,
    public readonly duplicateCollections: boolean = true,
    public readonly duplicateMembership: boolean = true,
    public readonly duplicateAutomations: boolean = true,
    public readonly destinationCircleId?: string,
  ) {}
}
