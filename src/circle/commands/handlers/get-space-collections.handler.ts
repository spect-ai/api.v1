import { InternalServerErrorException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CirclesCollectionService } from 'src/circle/services/circle-collection.service';
import { GetSpaceCollectionsCommand } from '../impl';

@CommandHandler(GetSpaceCollectionsCommand)
export class GetSpaceCollectionsCommandHandler
  implements ICommandHandler<GetSpaceCollectionsCommand>
{
  constructor(
    private readonly circleCollectionService: CirclesCollectionService,
  ) {}

  async execute(command: GetSpaceCollectionsCommand) {
    try {
      const { spaceId } = command;
      return await this.circleCollectionService.getAllCollections(spaceId);
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }
}
