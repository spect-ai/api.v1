import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ObjectId } from 'mongoose';
import { RequestProvider } from 'src/users/user.provider';
import { CreateTemplateDto } from './dto/create-project-template-dto';
import { DetailedTemplateResponseDto } from './dto/detailed-template-response.dto';
import { TemplatesRepository } from './tempates.repository';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const mongoose = require('mongoose');

@Injectable()
export class TemplatesService {
  constructor(
    private readonly templatesRepository: TemplatesRepository,
    private readonly requestProvider: RequestProvider,
  ) {}

  async getTemplates(
    type: string,
    circle: ObjectId,
    project: ObjectId,
  ): Promise<DetailedTemplateResponseDto[]> {
    return await this.templatesRepository.getTemplates(type, circle, project);
  }

  async create(
    createTemplateDto: CreateTemplateDto,
  ): Promise<DetailedTemplateResponseDto> {
    try {
      return await this.templatesRepository.create({
        ...createTemplateDto,
        creator: this.requestProvider.user._id,
      });
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed template creation',
        error.message,
      );
    }
  }
}
