import { AddPropertyDto } from 'src/collection/dto/update-property-request.dto';

export class AddPropertyCommand {
  constructor(
    public readonly addPropertyCommandDto: AddPropertyDto,
    public readonly caller: string,
    public readonly collectionId: string,
  ) {}
}
