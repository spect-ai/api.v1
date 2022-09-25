import { UpdatePropertyDto } from 'src/collection/dto/update-property-request.dto';

export class UpdatePropertyCommand {
  constructor(
    public readonly updatePropertyCommandDto: UpdatePropertyDto,
    public readonly caller: string,
    public readonly collectionId: string,
    public readonly propertyId: string,
  ) {}
}
