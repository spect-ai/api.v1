import { UpdateFolderOrderDto } from 'src/circle/dto/folder.dto';

export class UpdateFolderOrderCommand {
  constructor(
    public readonly circleId: string,
    public readonly updateFolderOrderDto: UpdateFolderOrderDto,
  ) {}
}
