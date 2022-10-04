import { AddDataDto } from 'src/collection/dto/update-data-request.dto';
import { AddPropertyDto } from 'src/collection/dto/update-property-request.dto';

export class AddDataCommand {
  constructor(
    public readonly addPropertyRequestDto: AddDataDto,
    public readonly caller: string,
    public readonly collectionId: string,
  ) {}
}
