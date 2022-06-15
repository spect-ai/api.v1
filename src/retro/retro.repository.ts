import { Injectable } from '@nestjs/common';
import { InjectModel } from 'nestjs-typegoose';
import { BaseRepository } from 'src/base/base.repository';
import { Retro } from './models/retro.model';

@Injectable()
export class RetroRepository extends BaseRepository<Retro> {
  constructor(@InjectModel(Retro) circleModel) {
    super(circleModel);
  }

  async getRetroWithPopulatedReferences(id: string): Promise<Retro> {
    return await this.findById(id).exec();
  }
  async getRetroWithPopulatedReferencesBySlug(slug: string): Promise<Retro> {
    return await this.findOne({ slug: slug }).exec();
  }

  async getRetroWithUnpopulatedReferences(id: string): Promise<Retro> {
    return await this.findById(id);
  }
}
