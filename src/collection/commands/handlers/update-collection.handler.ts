import { CommandHandler, ICommandHandler, QueryBus } from '@nestjs/cqrs';
import { CollectionRepository } from 'src/collection/collection.repository';
import { CollectionResponseDto } from 'src/collection/dto/collection-response.dto';
import { GetPrivateViewCollectionQuery } from 'src/collection/queries';
import { CommonTools } from 'src/common/common.service';
import { UpdateCollectionCommand } from '../impl/update-collection.command';

@CommandHandler(UpdateCollectionCommand)
export class UpdateCollectionCommandHandler
  implements ICommandHandler<UpdateCollectionCommand>
{
  constructor(
    private readonly collectionRepository: CollectionRepository,
    private readonly queryBus: QueryBus,
    private readonly commonTools: CommonTools,
  ) {}

  async execute(
    command: UpdateCollectionCommand,
  ): Promise<CollectionResponseDto> {
    const { updateCollectionDto, collectionId } = command;
    const updatedCollection = await this.collectionRepository.updateById(
      collectionId,
      updateCollectionDto,
    );

    return await this.queryBus.execute(
      new GetPrivateViewCollectionQuery(null, updatedCollection),
    );
  }
}
