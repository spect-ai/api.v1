import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { GetCircleByIdQuery } from 'src/circle/queries/impl';
import { GuildxyzService } from 'src/common/guildxyz.service';
import { MintKudosService } from 'src/common/mint-kudos.service';
import { RequestProvider } from 'src/users/user.provider';
import { CollectionRepository } from '../collection.repository';
import { CollectionResponseDto } from '../dto/collection-response.dto';
import { Collection } from '../model/collection.model';
import { GetCollectionByIdQuery, GetCollectionBySlugQuery } from '../queries';
import { ActivityResolver } from './activity.service';

@Injectable()
export class ResponseCredentialingService {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly requestProvider: RequestProvider,
    private readonly kudosService: MintKudosService,
    private readonly collectionRepository: CollectionRepository,
  ) {}

  async airdropMintkudosToken(collectionId: string) {
    const collection = await this.queryBus.execute(
      new GetCollectionByIdQuery(collectionId),
    );
    if (!collection) {
      throw new InternalServerErrorException('Collection not found');
    }

    if (
      collection.mintkudosClaimedBy &&
      collection.mintkudosClaimedBy.includes(this.requestProvider.user.id)
    ) {
      throw new InternalServerErrorException('User has already claimed kudos');
    }

    if (
      !collection.dataOwner ||
      !Object.values(collection.dataOwner)?.includes(
        this.requestProvider.user.id,
      )
    ) {
      throw new InternalServerErrorException(
        'User has not submitted a response',
      );
    }

    const operationId = await this.kudosService.airdropKudos(
      collection?.parents[0].id,
      collection.mintkudosTokenId,
      this.requestProvider.user.ethAddress,
    );
    if (operationId) {
      const mintkudosClaimedBy = collection.mintkudosClaimedBy || [];

      await this.collectionRepository.updateById(collection.id, {
        mintkudosClaimedBy: [
          ...mintkudosClaimedBy,
          this.requestProvider.user.id,
        ],
      });
    }
    return operationId;
  }
}
