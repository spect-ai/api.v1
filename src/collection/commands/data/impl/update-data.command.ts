import {
  AddDataDto,
  UpdateDataDto,
} from 'src/collection/dto/update-data-request.dto';

export class UpdateDataCommand {
  constructor(
    public readonly updateDataDto: UpdateDataDto,
    public readonly caller: string,
    public readonly collectionId: string,
    public readonly dataSlug: string,
  ) {}
}
