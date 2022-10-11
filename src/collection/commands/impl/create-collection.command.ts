import { CreateCollectionDto } from 'src/collection/dto/create-collection-request.dto';

export class CreateCollectionCommand {
  constructor(
    public readonly createCollectionDto: CreateCollectionDto,
    public readonly caller: string,
  ) {}
}
