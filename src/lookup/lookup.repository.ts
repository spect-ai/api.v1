import { Injectable } from '@nestjs/common';
import { InjectModel } from 'nestjs-typegoose';
import { BaseRepository } from 'src/base/base.repository';
import { Lookup } from './model/lookup.model';

@Injectable()
export class LookupRepository extends BaseRepository<Lookup> {
  constructor(@InjectModel(Lookup) lookupModel) {
    super(lookupModel);
  }
}
