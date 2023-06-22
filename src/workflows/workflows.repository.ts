import { Injectable } from '@nestjs/common';
import { InjectModel } from 'nestjs-typegoose';
import { BaseRepository } from 'src/base/base.repository';
import { Workflows } from './model/workflows.model';

@Injectable()
export class WorkflowRepository extends BaseRepository<Workflows> {
  constructor(@InjectModel(Workflows) secretModel) {
    super(secretModel);
  }
}
