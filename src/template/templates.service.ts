import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ObjectId } from 'mongoose';
import { RequestProvider } from 'src/users/user.provider';
import { CreateTemplateDto } from './dto/create-project-template-dto';
import { DetailedTemplateResponseDto } from './dto/detailed-template-response.dto';
import { TemplatesRepository } from './tempates.repository';
import { v4 as uuidv4 } from 'uuid';
import { MinimalColumnDetails } from './models/template.model';

export type StatusTrigger = {
  [key: string]: ConditionWithAction[];
};

export type ColumnTrigger = {
  [key: string]: ConditionWithAction[];
};

export type ConditionWithAction = {
  from?: boolean | number | string;
  to: boolean | number | string;
  actions: Actions;
};

export type Actions = {
  [key: string]: ColumnChangeAction | StatusChangeAction;
};

export type ColumnChangeAction = {
  to: string;
  index?: number;
};

export type StatusChangeAction = {
  paid?: boolean;
  archived?: boolean;
  active?: boolean;
};

const automationTree = {
  status: {
    paid: [
      {
        from: false,
        to: true,
        actions: {
          changeColumn: {
            to: 'To Do',
          } as ColumnChangeAction,
        } as Actions,
      } as ConditionWithAction,
    ],
    active: [
      {
        from: true,
        to: false,
        actions: {
          changeColumn: {
            to: 'Done',
          } as ColumnChangeAction,
        } as Actions,
      } as ConditionWithAction,
      {
        from: false,
        to: true,
        actions: {
          changeColumn: {
            to: 'In Progress',
          } as ColumnChangeAction,
        } as Actions,
      } as ConditionWithAction,
    ],
  } as StatusTrigger,
  columnId: [
    {
      to: 'Done',
      actions: {
        changeStatus: {
          active: false,
        } as StatusChangeAction,
      } as Actions,
    } as ConditionWithAction,
  ],
};

@Injectable()
export class TemplatesService {
  constructor(
    private readonly templatesRepository: TemplatesRepository,
    private readonly requestProvider: RequestProvider,
  ) {}

  async getTemplates(
    type: string,
    circle: string,
    project: string,
  ): Promise<DetailedTemplateResponseDto[]> {
    return await this.templatesRepository.getTemplates(type, circle, project);
  }

  async create(
    createTemplateDto: CreateTemplateDto,
  ): Promise<DetailedTemplateResponseDto> {
    try {
      const columnDetails = {} as MinimalColumnDetails;
      const columnNameToIdMap = {} as object;
      for (const columnName of createTemplateDto.projectData.columns) {
        const columnId = uuidv4();
        columnDetails[columnId] = {
          columnId,
          name: columnName,
          cards: [] as string[],
          defaultCardType: 'Task',
        };
        columnNameToIdMap[columnName] = columnId;
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

  async buildAutomationTemplate(
    createTemplateDto: CreateTemplateDto,
    columnNameToIdMap: object,
  ) {
    for (const [trigger, automation] of Object.entries(automationTree)) {
      if (trigger === 'status') {
        for (const [condition, actions] of Object.entries(
          automation as StatusTrigger,
        )) {
          for (const [action, actionData] of Object.entries(actions)) {
            if (action === 'changeColumn') {
              actionData.to = columnNameToIdMap[actionData.to as string];
            }
          }
        }
      } else if (trigger === 'columnId') {
        for (const condition of automation as ConditionWithAction[]) {
          condition.to = columnNameToIdMap[condition.to as string];
        }
      }
    }
  }
}
