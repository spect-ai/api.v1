import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  ChangeMemberAction,
  ChangeSimpleFieldAction,
  ChangeStatusAction,
  CloseCardAction,
  MultipleItemContainer,
} from 'src/automation/types/types';
import { Card } from 'src/card/model/card.model';
import { CardsProjectService } from 'src/project/cards.project.service';
import { Project } from 'src/project/model/project.model';
import {
  ChangeColumnActionCommand,
  ChangeDeadlineActionCommand,
  ChangeLabelActionCommand,
  ChangeMemberActionCommand,
  ChangeSimpleFieldActionCommand,
  ChangeStatusActionCommand,
  CloseCardActionCommand,
  CloseParentCardActionCommand,
  TakeActionsCommand,
} from '../impl/take-action.command';

@CommandHandler(ChangeStatusActionCommand)
export class ChangeStatusActionCommandHandler
  implements ICommandHandler<ChangeStatusActionCommand>
{
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  constructor() {}

  async execute(
    query: ChangeStatusActionCommand,
  ): Promise<MultipleItemContainer> {
    console.log('ChangeStatusActionCommandHandler');

    const { performAutomationCommandContainer, action } = query;
    const { card } = performAutomationCommandContainer;

    return {
      cards: {
        [card.id]: {
          status: {
            ...card.status,
            ...(action.item as ChangeStatusAction).to,
          },
        },
      },
    };
  }
}

@CommandHandler(ChangeMemberActionCommand)
export class ChangeMemberActionCommandHandler
  implements ICommandHandler<ChangeMemberActionCommand>
{
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  constructor() {}

  async execute(
    query: ChangeMemberActionCommand,
  ): Promise<MultipleItemContainer> {
    console.log('ChangeMemberActionCommandHandler');

    const { performAutomationCommandContainer, action, caller } = query;
    const { card } = performAutomationCommandContainer;
    const memberType = action.id === 'changeAssignee' ? 'assignee' : 'reviewer';
    const item = action.item as ChangeMemberAction;
    let resCard = {
      [memberType]: card[memberType],
    };
    if (item.addCaller) {
      resCard = {
        [memberType]: [...resCard[memberType], caller],
      };
    }
    if (item.removeCaller) {
      resCard = {
        [memberType]: resCard[memberType].filter((member) => caller !== member),
      };
    }

    if (item.add) {
      resCard = {
        [memberType]: [...resCard[memberType], ...item.add],
      };
    }
    if (item.remove) {
      resCard = {
        [memberType]: resCard[memberType].filter(
          (member) => !item.remove.includes(member),
        ),
      };
    }
    if (item.set) {
      resCard = {
        [memberType]: item.set,
      };
    }
    if (item.setToCaller) {
      resCard = {
        [memberType]: [caller],
      };
    }
    if (item.clear) {
      resCard = {
        [memberType]: [],
      };
    }

    return {
      cards: {
        [card.id]: resCard,
      },
    };
  }
}

@CommandHandler(ChangeLabelActionCommand)
export class ChangeLabelActionCommandHandler
  implements ICommandHandler<ChangeLabelActionCommand>
{
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  constructor() {}

  async execute(
    query: ChangeLabelActionCommand,
  ): Promise<MultipleItemContainer> {
    console.log('ChangeLabelActionCommandHandler');

    const { performAutomationCommandContainer, action } = query;
    const { card } = performAutomationCommandContainer;
    const item = action.item as ChangeMemberAction;
    let resCard = {};

    if (item.set) {
      resCard = {
        labels: item.set,
      };
    }
    if (item.add) {
      resCard = {
        labels: [...card.labels, ...item.add],
      };
    }
    if (item.remove) {
      resCard = {
        labels: card.labels.filter((label) => !item.remove.includes(label)),
      };
    }
    if (item.clear) {
      resCard = {
        labels: [],
      };
    }

    return {
      cards: {
        [card.id]: resCard,
      },
    };
  }
}

@CommandHandler(ChangeSimpleFieldActionCommand)
export class ChangeSimpleFieldActionCommandHandler
  implements ICommandHandler<ChangeSimpleFieldActionCommand>
{
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  constructor() {}

  async execute(
    query: ChangeSimpleFieldActionCommand,
  ): Promise<MultipleItemContainer> {
    console.log('ChangeSimpleFieldActionCommandHandler');

    const { performAutomationCommandContainer, action } = query;
    const { card } = performAutomationCommandContainer;
    const item = action.item as ChangeSimpleFieldAction;
    switch (action.id) {
      case 'changeType':
        return {
          cards: {
            [card.id]: {
              type: item.to as 'Task' | 'Bounty',
            },
          },
        };
      case 'changePriority':
        return {
          cards: {
            [card.id]: {
              priority: item.to as number,
            },
          },
        };
      default:
        return {
          cards: {
            [card.id]: {},
          },
        };
    }
  }
}

@CommandHandler(ChangeColumnActionCommand)
export class ChangeColumnActionCommandHandler
  implements ICommandHandler<ChangeColumnActionCommand>
{
  constructor(private readonly cardsProjectService: CardsProjectService) {}

  async execute(
    query: ChangeColumnActionCommand,
  ): Promise<MultipleItemContainer> {
    console.log('ChangeColumnActionCommandHandler');

    const { performAutomationCommandContainer, action } = query;
    const { card, project } = performAutomationCommandContainer;
    const item = action.item as ChangeSimpleFieldAction;

    const updatedProject = this.cardsProjectService.reorderCardNew(
      project,
      card.id,
      {
        destinationColumnId: item.to as string,
        destinationCardIndex: 0,
      },
    );

    return {
      cards: {
        [card.id]: {
          columnId: item.to as string,
        },
      },
      projects: updatedProject,
    };
  }
}

@CommandHandler(CloseCardActionCommand)
export class CloseCardActionCommandHandler
  implements ICommandHandler<CloseCardActionCommand>
{
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  constructor() {}

  async execute(query: CloseCardActionCommand): Promise<MultipleItemContainer> {
    console.log('CloseCardActionCommandHandler');

    const { performAutomationCommandContainer, action } = query;
    const { card, project, misc } = performAutomationCommandContainer;
    const item = action.item as CloseCardAction;
    let res = {};
    if (misc.subCards && misc.subCards[card.id])
      for (const subCard of misc.subCards[card.id]) {
        res = {
          ...res,
          [subCard.id]: {
            status: {
              ...subCard.status,
              active: false,
            },
          },
        };
      }

    return {
      cards: {
        ...res,
        [card.id]: {
          status: {
            ...card.status,
            active: false,
          },
        },
      },
    };
  }
}

@CommandHandler(CloseParentCardActionCommand)
export class CloseParentCardActionCommandHandler
  implements ICommandHandler<CloseParentCardActionCommand>
{
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  constructor() {}

  async execute(
    query: CloseParentCardActionCommand,
  ): Promise<MultipleItemContainer> {
    console.log('CloseParentCardActionCommandHandler');

    const { performAutomationCommandContainer, action } = query;
    const { card, project, misc } = performAutomationCommandContainer;
    const item = action.item as CloseCardAction;
    let res = {};
    if (misc.parentCards && misc.parentCards[card.id])
      for (const parentCard of misc.parentCards[card.id]) {
        res = {
          ...res,
          [parentCard.id]: {
            status: {
              ...parentCard.status,
              active: false,
            },
          },
        };
      }

    return {
      cards: res,
    };
  }
}

// @CommandHandler(ChangeDeadlineActionCommand)
// export class ChangeDeadlineActionCommandHandler
//   implements ICommandHandler<ChangeDeadlineActionCommand>
// {
//   constructor() {}

//   async execute(query: ChangeDeadlineActionCommand): Promise<Card> {
//     console.log('ChangeDeadlineActionCommandHandler');

//     const { card, action } = query;

//     return true;
//   }
// }
