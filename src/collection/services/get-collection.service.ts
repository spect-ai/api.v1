import { Injectable, NotFoundException } from '@nestjs/common';
import { LookupRepository } from 'src/lookup/lookup.repository';
import { CollectionRepository } from '../collection.repository';
import { Collection } from '../model/collection.model';
import { PopulatedCollectionFields } from '../types/types';

@Injectable()
export class GetCollectionService {
  constructor(
    private readonly collectionRepository: CollectionRepository,
    private readonly lookupRepository: LookupRepository,
  ) {}

  async getCollectionFromAnyId(
    collection?: Collection,
    collectionId?: string,
    threadId?: string,
    customPopulate?: PopulatedCollectionFields,
    selectedFields?: Record<string, unknown>,
  ): Promise<Collection> {
    if (!collection && !collectionId && !threadId) {
      throw 'No collection id or other identifier provided to retrieve collection';
    }
    if (collection) {
      return collection;
    }
    if (collectionId) {
      return this.collectionRepository.getCollectionById(
        collectionId,
        customPopulate,
        selectedFields,
      );
    }
    if (threadId) {
      const lookedUpData = await this.lookupRepository.findOne({
        key: threadId,
        keyType: 'discordThreadId',
      });
      return this.collectionRepository.getCollectionById(
        lookedUpData.collectionId,
        customPopulate,
        selectedFields,
      );
    }

    if (!collection) {
      throw new NotFoundException('Collection not found');
    }
  }
}
