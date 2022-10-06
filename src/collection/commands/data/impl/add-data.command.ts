import { AddDataDto } from 'src/collection/dto/update-data-request.dto';

export class AddDataCommand {
  constructor(
    public readonly data: object,
    public readonly caller: string,
    public readonly collectionId: string,
  ) {}
}
