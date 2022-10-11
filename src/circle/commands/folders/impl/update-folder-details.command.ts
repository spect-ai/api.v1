import { UpdateFolderDetailsDto } from 'src/circle/dto/folder.dto';

export class UpdateFolderDetailsCommand {
  constructor(
    public readonly circleId: string,
    public readonly updateFolderDetailsDto: UpdateFolderDetailsDto,
  ) {}
}
