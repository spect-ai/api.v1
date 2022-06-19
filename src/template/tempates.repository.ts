import { Injectable } from '@nestjs/common';
import { InjectModel } from 'nestjs-typegoose';
import { BaseRepository } from 'src/base/base.repository';
import { Template } from './models/template.model';
import { Ref } from '@typegoose/typegoose';
import { ObjectId, Types } from 'mongoose';

@Injectable()
export class TemplatesRepository extends BaseRepository<Template> {
  constructor(@InjectModel(Template) templateModel) {
    super(templateModel);
  }

  async getTemplate(id: string): Promise<Template> {
    return await this.findById(id);
  }

  async getTemplates(
    type: string,
    circle?: string,
    project?: string,
  ): Promise<Template[]> {
    return await this.findAll({
      $or: [
        { type: type, global: true },
        { type: type, circle: circle /*project: project*/ }, // project is not in schema, error thrown
      ],
    });
  }
}
