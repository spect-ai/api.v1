import { CreateFolderDto } from 'src/circle/dto/folder.dto';

export class CreateFolderCommand {
  constructor(
    public readonly circleId: string,
    public readonly createFolderDto: CreateFolderDto,
  ) {}
}
