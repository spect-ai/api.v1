import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ObjectId } from 'mongoose';
import { RequestProvider } from 'src/users/user.provider';
import { CreateTemplateDto } from './dto/create-project-template-dto';
import { DetailedTemplateResponseDto } from './dto/detailed-template-response.dto';
import { TemplatesRepository } from './tempates.repository';
import { v4 as uuidv4 } from 'uuid';
import { MinimalColumnDetails } from './models/template.model';
import { DataStructureManipulationService } from 'src/common/dataStructureManipulation.service';

// const automations = [
//   {
//     name: 'some automation',
//     triggerProperty: 'status.active',
//     value: {
//       from: false,
//       to: true,
//     },
//     conditions: [
//       {
//         property: 'assignee',
//         value: { has: 'some user' },
//       },
//     ],
//     actions: [
//       {
//         property: 'column',
//         value: {
//           to: 'Done',
//         },
//       },
//     ],
//   },
//   {
//     name: 'some automation',
//     triggerProperty: 'status.active',
//     value: {
//       from: false, // to, from, added, removed, cleared
//       to: true,
//     },
//     conditions: [
//       {
//         property: 'assignee',
//         value: { has: 'some user' }, // is, has, hasNot, isNot, isOneOf, isNotOneOf, isEmpty, isNotEmpty
//       },
//     ],
//     actions: [
//       {
//         property: 'columnId',
//         value: {
//           to: 'Done', // to, add, removee, clear
//         },
//       },
//     ],
//   },
// ];

@Injectable()
export class TemplatesService {
  constructor(
    private readonly templatesRepository: TemplatesRepository,
    private readonly requestProvider: RequestProvider,
    private readonly datastructuresService: DataStructureManipulationService,
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

      const cleanAutomations = this.cleanAutomationData(
        createTemplateDto.projectData.automations,
        columnNameToIdMap,
      );
      const [automations, automationOrder] =
        this.buildAutomationData(cleanAutomations);

      return await this.templatesRepository.create({
        ...createTemplateDto,
        creator: this.requestProvider.user._id,
        projectData: {
          columnDetails,
          columnOrder,
          automations,
          automationOrder,
        },
      });
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed template creation',
        error.message,
      );
    }
  }

  buildAutomationData(automations: any) {
    const automationOrder = [] as string[];
    for (const automation of automations) {
      const automationId = uuidv4();
      automation['id'] = automationId;
      automationOrder.push(automationId);
    }

    automations = this.datastructuresService.objectify(automations, 'id');

    return [automations, automationOrder];
  }

  cleanAutomationData(automations: any, columnNameToIdMap: object) {
    const resAutomations = [] as any[];
    for (let automation of automations) {
      automation = this.cleanAutomationColumnData(
        automation,
        'triggerProperty',
        columnNameToIdMap,
      );

      const autoConditions = [] as any[];
      for (const condition of automation.conditions) {
        autoConditions.push(
          this.cleanAutomationColumnData(
            condition,
            'property',
            columnNameToIdMap,
          ),
        );
      }
      automation.conditions = autoConditions;

      const autoActions = [] as any[];
      for (const action of automation.actions) {
        autoActions.push(
          this.cleanAutomationColumnData(action, 'property', columnNameToIdMap),
        );
      }
      automation.actions = autoActions;
      resAutomations.push(automation);
    }
    return resAutomations;
  }

  cleanAutomationColumnData(
    obj: object,
    key: string,
    columnNameToIdMap: object,
  ) {
    if (obj[key] === 'column') {
      obj[key] = 'columnId';
      for (const [key, val] of Object.entries(obj['value'])) {
        obj['value'][key] = columnNameToIdMap[val as string];
      }
    }
    return obj;
  }
}
