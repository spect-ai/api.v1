import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ObjectId } from 'mongoose';
import { RequestProvider } from 'src/users/user.provider';
import { CreateTemplateDto } from './dto/create-project-template-dto';
import { DetailedTemplateResponseDto } from './dto/detailed-template-response.dto';
import { TemplatesRepository } from './tempates.repository';
import { v4 as uuidv4 } from 'uuid';
import { MinimalColumnDetails } from './models/template.model';
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
      const columnDetails = {} as MinimalColumnDetails;
      for (const columnName of createTemplateDto.projectData.columns) {
        const columnId = uuidv4();
        columnDetails[columnId] = {
          columnId,
          name: columnName,
          cards: [] as ObjectId[],
          defaultCardType: 'Task',
        };
      }
      const columnOrder = Object.keys(columnDetails);

      return await this.templatesRepository.create({
        ...createTemplateDto,
        creator: this.requestProvider.user._id,
        projectData: {
          columnDetails,
          columnOrder,
        },
      });
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed template creation',
        error.message,
      );
    }
  }
}
