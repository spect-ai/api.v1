import { Injectable } from '@nestjs/common';
import { InjectModel } from 'nestjs-typegoose';
import { EntityRepository } from 'src/database/entity.repository';
import { CreateCatDto } from './dto/create-cat.dto';
import { Cat } from './model/cat.model';

@Injectable()
export class CatsRepository extends EntityRepository<Cat, CreateCatDto> {
  constructor(@InjectModel(Cat) catModel) {
    super(catModel);
  }
}
