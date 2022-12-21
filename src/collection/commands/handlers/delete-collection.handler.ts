import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CollectionRepository } from 'src/collection/collection.repository';
import { DeleteCollectionCommand } from '../impl/delete-collection.command';

@CommandHandler(DeleteCollectionCommand)
export class DeleteCollectionCommandHandler
  implements ICommandHandler<DeleteCollectionCommand>
{
  constructor(private readonly collectionRepository: CollectionRepository) {}

  async execute(command: DeleteCollectionCommand) {
    const { collectionId } = command;
    await this.collectionRepository.deleteById(collectionId);
    return {
      ok: true,
    };
  }
}
