import { CommandHandler, ICommandHandler, QueryBus } from '@nestjs/cqrs';
import { CollectionRepository } from 'src/collection/collection.repository';
import { Collection } from 'src/collection/model/collection.model';
import { Properties } from 'src/collection/types/types';
import { CommonTools } from 'src/common/common.service';
import { CreateCollectionCommand } from '../impl/create-collection.command';
import { v4 as uuidv4 } from 'uuid';

@CommandHandler(CreateCollectionCommand)
export class CreateCollectionCommandHandler
  implements ICommandHandler<CreateCollectionCommand>
{
  constructor(
    private readonly collectionRepository: CollectionRepository,
    private readonly queryBus: QueryBus,
    private readonly commonTools: CommonTools,
  ) {}

  async execute(command: CreateCollectionCommand): Promise<Collection> {
    const { createCollectionDto, caller } = command;

    let properties = {} as Properties;
    if (createCollectionDto.properties) {
      properties = this.commonTools.objectify(
        createCollectionDto.properties,
        'name',
      ) as Properties;
    }

    const createdCollection = await this.collectionRepository.create({
      ...createCollectionDto,
      properties,
      creator: caller,
      parents: [createCollectionDto.circleId],
      slug: uuidv4(),
    });

    return createdCollection;
  }
}
