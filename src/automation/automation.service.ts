import { Injectable } from '@nestjs/common';
import { CardsRepository } from 'src/card/cards.repository';
import { CardsService } from 'src/card/cards.service';
import { Card } from 'src/card/model/card.model';
import { CardsProjectService } from 'src/project/cards.project.service';
import { Project } from 'src/project/model/project.model';
import { ProjectsRepository } from 'src/project/project.repository';
import { ProjectService } from 'src/project/project.service';
import { GlobalDocumentUpdate } from 'src/common/types/update.type';

@Injectable()
export class AutomationService {
  constructor(
    private readonly projectService: ProjectService,
    private readonly cardProjectService: CardsProjectService,
    private readonly projectRepository: ProjectsRepository,
    private readonly cardRepository: CardsRepository,
    private readonly cardService: CardsService,
  ) {}

  findCardAndReqValues(
    card: Card,
    update: Partial<Card>,
    triggerPropertyArray: any[],
  ) {
    let currCardVal = card;
    let currReqVal = update;
    for (const triggerProperty of triggerPropertyArray) {
      if (
        !currCardVal.hasOwnProperty(triggerProperty) ||
        !currReqVal.hasOwnProperty(triggerProperty)
      ) {
        return false;
      }
      currCardVal = currCardVal[triggerProperty];
      currReqVal = currReqVal[triggerProperty];
    }
    return [currCardVal, currReqVal];
  }

  satisfiesCondition(card: Card, condition: any): boolean {
    return true;
  }

  satisfiesConditions(card: Card, conditions: any[]): boolean {
    for (const condition of conditions) {
      if (!this.satisfiesCondition(card, condition)) {
        return false;
      }
    }
    return true;
  }

  satisfiesValueUpdate(
    currVal: any,
    newVal: any,
    automationValUpdate: any,
  ): boolean {
    for (const [key, value] of Object.entries(automationValUpdate)) {
      if (key === 'from') {
        if (currVal !== value) return false;
      } else if (key === 'to') {
        if (newVal !== value) return false;
      }
    }
    return true;
  }

  takeColumnAction(
    globalUpdate: GlobalDocumentUpdate,
    value: any,
    card: Card,
    project: Project,
  ): GlobalDocumentUpdate {
    const projectUpdate = this.cardProjectService.reorderCardNew(
      project,
      card.id,
      {
        destinationColumnId: value.to,
        destinationCardIndex: value.index ? value.index : 0,
      },
    );

    const cardUpdate = {
      [card.id]: {
        columnId: value.to,
      },
    };

    globalUpdate.project = {
      ...globalUpdate.project,
      ...projectUpdate,
    };

    globalUpdate.card = {
      ...globalUpdate.card,
      ...cardUpdate,
    };

    return globalUpdate;
  }

  takeStatusAction(
    globalUpdate: GlobalDocumentUpdate,
    card: Card,
    properties: string[],
    value: any,
  ): GlobalDocumentUpdate {
    for (const [key, val] of Object.entries(value)) {
      if (key === 'to') {
        const cardUpdate = {
          [card.id]: {
            status: {
              ...card.status,
              [properties[1]]: val,
            },
          },
        };
        globalUpdate.card = {
          ...globalUpdate.card,
          ...cardUpdate,
        };
      }
    }
    return globalUpdate;
  }

  handleAutomation(
    card: Card,
    project: Project,
    update: Partial<Card>,
  ): GlobalDocumentUpdate {
    let globalUpdate: GlobalDocumentUpdate = {
      card: {},
      project: {},
    };
    for (const automationId of project.automationOrder) {
      const automation = project.automations[automationId];
      const triggerPropertyArray = automation.triggerProperty.split('.');
      const values = this.findCardAndReqValues(
        card,
        update,
        triggerPropertyArray,
      );
      console.log(values);
      if (!values) continue;
      const currVal = values[0];
      const newVal = values[1];
      const satisfiesValueUpdate = this.satisfiesValueUpdate(
        currVal,
        newVal,
        automation.value,
      );
      if (!satisfiesValueUpdate) continue;
      const satisfiesConditions = this.satisfiesConditions(
        card,
        automation.conditions,
      );
      if (!satisfiesConditions) continue;

      for (const action of automation.actions) {
        const properties = action.property.split('.');
        const value = action.value;
        if (properties[0] === 'columnId') {
          globalUpdate = this.takeColumnAction(
            globalUpdate,
            value,
            card,
            project,
          );
        } else if (properties[0] === 'status') {
          globalUpdate = this.takeStatusAction(
            globalUpdate,
            card,
            properties,
            value,
          );
        }
      }
    }

    return globalUpdate;
  }
}
