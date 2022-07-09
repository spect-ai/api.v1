import { Injectable } from '@nestjs/common';
import { CardsRepository } from 'src/card/cards.repository';
import { CardsService } from 'src/card/cards.service';
import { Card } from 'src/card/model/card.model';
import { CardsProjectService } from 'src/project/cards.project.service';
import { Project } from 'src/project/model/project.model';
import { ProjectsRepository } from 'src/project/project.repository';
import { ProjectService } from 'src/project/project.service';
import { GlobalDocumentUpdate } from 'src/common/types/update.type';
import { Condition } from './types/types';

@Injectable()
export class AutomationService {
  constructor(
    private readonly projectService: ProjectService,
    private readonly cardProjectService: CardsProjectService,
    private readonly projectRepository: ProjectsRepository,
    private readonly cardRepository: CardsRepository,
    private readonly cardService: CardsService,
  ) {}

  // TODO: Handle all data types
  satisfied(
    valueToCheck: any,
    valueToCheckAgainst: any,
    condition: 'is' | 'has' | 'isNot' | 'hasNot' | 'isEmpty' | 'isNotEmpty',
  ) {
    if (condition === 'is') {
      // console.log('is');
      // console.log(valueToCheck, valueToCheckAgainst);
      return valueToCheck === valueToCheckAgainst;
    } else if (condition === 'has') {
      return valueToCheck.includes(valueToCheckAgainst);
    } else if (condition === 'isNot') {
      console.log(valueToCheck, valueToCheckAgainst);
      return valueToCheck !== valueToCheckAgainst;
    } else if (condition === 'hasNot') {
      return !valueToCheck.includes(valueToCheckAgainst);
    } else if (condition === 'isEmpty') {
      return valueToCheck === '';
    } else if (condition === 'isNotEmpty') {
      return valueToCheck !== '';
    } else {
      return false;
    }
  }

  /**
   * @param cardTree A partial card tree, could be the updated card or the entire card object
   * @param triggerPropertyArray
   *        eg.  ['status', 'paid'], ['columnId'], ['workThreads', '[any]', 'status']
   * @param value
   *        eg. true, 'inReview' etc
   *
   * @returns A boolean value indicating whether the card satisfies the condition
   */

  satisfiesCondition(
    cardTree: Partial<Card>,
    triggerPropertyArray: string[],
    value: any,
    condition: 'is' | 'has' | 'isNot' | 'hasNot' | 'isEmpty' | 'isNotEmpty',
  ): boolean {
    console.log('in satisfies condition');
    console.log(cardTree);

    console.log(triggerPropertyArray);
    console.log(value);
    if (triggerPropertyArray.length === 0)
      return this.satisfied(cardTree, value, condition);

    if (triggerPropertyArray[0] === '[any]') {
      for (const [key, val] of Object.entries(cardTree)) {
        if (
          this.satisfiesCondition(
            val as Partial<Card>,
            triggerPropertyArray.slice(1),
            value,
            condition,
          )
        ) {
          return true;
        }
      }
    }

    if (triggerPropertyArray[0] === '[all]') {
      for (const [key, val] of Object.entries(cardTree)) {
        if (
          !this.satisfiesCondition(
            val as Partial<Card>,
            triggerPropertyArray.slice(1),
            value,
            condition,
          )
        ) {
          return false;
        }
      }
      return true;
    }
    if (cardTree.hasOwnProperty(triggerPropertyArray[0])) {
      return this.satisfiesCondition(
        cardTree[triggerPropertyArray[0]],
        triggerPropertyArray.slice(1),
        value,
        condition,
      );
    }

    return false;
  }

  satisfiesValues(
    prevCard: Card,
    newCard: Partial<Card>,
    properties: string[],
    values: any,
  ): boolean {
    // console.log(prevCard.status, newCard.status);
    if (values.hasOwnProperty('to') && values.hasOwnProperty('from')) {
      // console.log('has to and from');
      // console.log(values.from, values.to);
      return (
        this.satisfiesCondition(prevCard, properties, values.from, 'is') &&
        this.satisfiesCondition(newCard, properties, values.to, 'is')
      );
    }
    if (values.hasOwnProperty('to')) {
      // console.log('has toppppppppppppppppppppppppppppppppppppp');
      // console.log(
      //   this.satisfiesCondition(newCard, properties, values.to, 'is'),
      // );
      // console.log(
      //   'has to nottttttttttttttttttttttttttttttttttttttttttttttttttt',
      // );
      // console.log(
      //   !this.satisfiesCondition(prevCard, properties, values.to, 'is'),
      // );
      return (
        this.satisfiesCondition(newCard, properties, values.to, 'is') &&
        !this.satisfiesCondition(prevCard, properties, values.to, 'is')
      );
    }
    if (values.hasOwnProperty('from')) {
      return (
        !this.satisfiesCondition(newCard, properties, values.from, 'is') &&
        this.satisfiesCondition(prevCard, properties, values.from, 'is')
      );
    }
  }

  satisfiesConditions(card: Card, conditions: Condition[]): boolean {
    for (const condition of conditions) {
      for (const [key, value] of Object.entries(condition)) {
        if (
          !this.satisfiesCondition(
            card,
            condition.property.split('.'),
            value,
            key as 'is' | 'has' | 'isNot' | 'hasNot' | 'isEmpty' | 'isNotEmpty',
          )
        ) {
          return false;
        }
      }
    }
    return true;
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
      // console.log('   ');
      // console.log(automation.name);
      const triggerPropertyArray = automation.triggerProperty.split('.');
      if (
        !this.satisfiesValues(
          card,
          update,
          triggerPropertyArray,
          automation.value,
        )
      )
        continue;
      // console.log('satisfies values');
      if (!this.satisfiesConditions(card, automation.conditions)) continue;
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
            properties,
            value,
            card,
          );
        }
      }
    }
    return globalUpdate;
  }

  takeColumnAction(
    globalUpdate: GlobalDocumentUpdate,
    value: any,
    card: Card,
    project: Project,
  ): GlobalDocumentUpdate {
    if (!project.columnOrder.includes(value.to)) return globalUpdate;
    const projectUpdate = this.cardProjectService.reorderCard(
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
    properties: string[],
    value: any,
    card: Card,
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
}
