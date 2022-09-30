import { UpdateFolderDto } from 'src/circle/dto/folder.dto';

export class UpdateFolderCommand {
  constructor(
    public readonly circleId: string,
    public readonly folderId: string,
    public readonly updateFolderDto: UpdateFolderDto,
  ) {}
}
