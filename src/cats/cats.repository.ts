import { Injectable } from '@nestjs/common';
import { InjectModel } from 'nestjs-typegoose';
import { BaseRepository } from 'src/base/base.repository';
import { CreateCatDto } from './dto/create-cat.dto';
import { Cat } from './model/cat.model';

@Injectable()
export class CatsRepository extends BaseRepository<Cat> {
  constructor(@InjectModel(Cat) catModel) {
    super(catModel);
  }
}
