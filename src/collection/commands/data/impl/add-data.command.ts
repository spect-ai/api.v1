import { AddDataDto } from 'src/collection/dto/update-data-request.dto';
import { User } from 'src/users/model/users.model';

export class AddDataCommand {
  constructor(
    public readonly data: object,
    public readonly caller: User,
    public readonly collectionId: string,
  ) {}
}
