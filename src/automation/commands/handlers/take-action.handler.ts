import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  ChangeMemberAction,
  ChangeSimpleFieldAction,
  ChangeStatusAction,
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
} from '../impl/take-action.command';

@CommandHandler(ChangeStatusActionCommand)
export class ChangeStatusActionCommandHandler
  implements ICommandHandler<ChangeStatusActionCommand>
{
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  constructor() {}

  async execute(query: ChangeStatusActionCommand): Promise<Card> {
    console.log('ChangeStatusActionCommandHandler');

    const { card, action } = query;

    return {
      ...card,
      status: {
        ...card.status,
        ...(action.item as ChangeStatusAction).to,
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

  async execute(query: ChangeMemberActionCommand): Promise<Card> {
    console.log('ChangeMemberActionCommandHandler');

    const { card, action } = query;

    const memberType = action.id === 'changeAssignee' ? 'assignee' : 'reviewer';
    const item = action.item as ChangeMemberAction;
    let resCard = card;

    if (item.set) {
      resCard = {
        ...card,
        [memberType]: item.set,
      };
    }
    if (item.add) {
      resCard = {
        ...card,
        [memberType]: [...card[memberType], ...item.add],
      };
    }
    if (item.remove) {
      resCard = {
        ...card,
        [memberType]: card[memberType].filter(
          (member) => !item.remove.includes(member),
        ),
      };
    }
    if (item.clear) {
      resCard = {
        ...card,
        [memberType]: [],
      };
    }

    return resCard;
  }
}

@CommandHandler(ChangeLabelActionCommand)
export class ChangeLabelActionCommandHandler
  implements ICommandHandler<ChangeLabelActionCommand>
{
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  constructor() {}

  async execute(query: ChangeLabelActionCommand): Promise<Card> {
    console.log('ChangeLabelActionCommandHandler');

    const { card, action } = query;

    const item = action.item as ChangeMemberAction;
    let resCard = card;

    if (item.set) {
      resCard = {
        ...card,
        labels: item.set,
      };
    }
    if (item.add) {
      resCard = {
        ...card,
        labels: [...card.labels, ...item.add],
      };
    }
    if (item.remove) {
      resCard = {
        ...card,
        labels: card.labels.filter((label) => !item.remove.includes(label)),
      };
    }
    if (item.clear) {
      resCard = {
        ...card,
        labels: [],
      };
    }

    return resCard;
  }
}

@CommandHandler(ChangeSimpleFieldActionCommand)
export class ChangeSimpleFieldActionCommandHandler
  implements ICommandHandler<ChangeSimpleFieldActionCommand>
{
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  constructor() {}

  async execute(query: ChangeSimpleFieldActionCommand): Promise<Card> {
    console.log('ChangeSimpleFieldActionCommandHandler');

    const { card, action } = query;
    const item = action.item as ChangeSimpleFieldAction;
    switch (action.id) {
      case 'changeType':
        return {
          ...card,
          type: item.to as 'Task' | 'Bounty',
        };
      case 'changePriority':
        return {
          ...card,
          priority: item.to as number,
        };
      default:
        return card;
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
  ): Promise<{ card: Partial<Card>; project: Partial<Project> }> {
    console.log('ChangeColumnActionCommandHandler');

    const { card, extra, action } = query;
    const project = extra.project;
    const item = action.item as ChangeSimpleFieldAction;

    const updatedProject = this.cardsProjectService.reorderCard(
      project,
      card._id.toString(),
      {
        destinationColumnId: item.to as string,
        destinationCardIndex: 0,
      },
    );

    return {
      card: {
        columnId: item.to as string,
      },
      project: updatedProject[project._id.toString()],
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
