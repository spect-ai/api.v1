import { Injectable } from '@nestjs/common';
import { CardsRepository } from 'src/card/cards.repository';
import { CardsService } from 'src/card/cards.service';
import { UpdateCardRequestDto } from 'src/card/dto/update-card-request.dto';
import { Card } from 'src/card/model/card.model';
import { CardsProjectService } from 'src/project/cards.project.service';
import { Project } from 'src/project/model/project.model';
import { ProjectsRepository } from 'src/project/project.repository';
import { ProjectService } from 'src/project/project.service';
import mongodb from 'mongodb';
import { GlobalDocumentUpdate } from 'src/common/types/update.type';

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
            to: 'd0dd9ef1-d24f-4d4c-bb37-1b22e618ab88',
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
            to: '414c1da8-9fa5-41fd-a39a-c5692cff481b',
          } as ColumnChangeAction,
        } as Actions,
      } as ConditionWithAction,
      {
        from: false,
        to: true,
        actions: {
          changeColumn: {
            to: '32a831c8-50a5-41b8-b9a1-a5ffe7e03c5d',
          } as ColumnChangeAction,
        } as Actions,
      } as ConditionWithAction,
    ],
  } as StatusTrigger,
  columnId: [
    {
      to: 'd0dd9ef1-d24f-4d4c-bb37-1b22e618ab88',
      actions: {
        changeStatus: {
          paid: true,
        } as StatusChangeAction,
      } as Actions,
    } as ConditionWithAction,
  ],
};

@Injectable()
export class AutomationService {
  constructor(
    private readonly projectService: ProjectService,
    private readonly cardProjectService: CardsProjectService,
    private readonly projectRepository: ProjectsRepository,
    private readonly cardRepository: CardsRepository,
    private readonly cardService: CardsService,
  ) {}

  handleAutomation(
    card: Card,
    project: Project,
    req: UpdateCardRequestDto,
  ): GlobalDocumentUpdate {
    let globalUpdate: GlobalDocumentUpdate = {
      card: {},
      project: {},
    };
    for (const [field, value] of Object.entries(req)) {
      if (automationTree.hasOwnProperty(field)) {
        if (field === 'status') {
          for (const [statusType, conditionsWithActions] of Object.entries(
            automationTree[field],
          )) {
            for (const conditionWithAction of conditionsWithActions) {
              if (
                conditionWithAction.from === card.status[statusType] &&
                conditionWithAction.to === value[statusType]
              ) {
                for (const [action, actionValue] of Object.entries(
                  conditionWithAction.actions,
                )) {
                  if (action === 'changeColumn') {
                    globalUpdate = this.handleColumnChange(
                      card,
                      project,
                      {
                        to: (actionValue as ColumnChangeAction).to,
                      },
                      globalUpdate,
                    );
                  }
                }
              }
            }
          }
        } else if (field === 'columnId') {
          for (const conditionWithAction of automationTree[field]) {
            if (
              (!conditionWithAction.from ||
                conditionWithAction.from === card.columnId) &&
              conditionWithAction.to === value
            ) {
              for (const [action, actionValue] of Object.entries(
                conditionWithAction.actions,
              )) {
                if (action === 'changeStatus') {
                  globalUpdate = this.handleStatusChange(
                    card,
                    actionValue as StatusChangeAction,
                    globalUpdate,
                  );
                }
              }
            }
          }
        }
      }
    }

    return globalUpdate;
  }

  handleColumnChange(
    card: Card,
    project: Project,
    columnChange: ColumnChangeAction,
    globalUpdate: GlobalDocumentUpdate,
  ): GlobalDocumentUpdate {
    const projectUpdate = this.cardProjectService.reorderCardNew(
      project,
      card.id,
      {
        destinationColumnId: columnChange.to,
        destinationCardIndex: columnChange.index ? columnChange.index : 0,
      },
    );

    const cardUpdate = {
      [card.id]: {
        columnId: columnChange.to,
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

  handleStatusChange(
    card: Card,
    statusChange: StatusChangeAction,
    globalUpdate: GlobalDocumentUpdate,
  ): GlobalDocumentUpdate {
    const cardUpdate = {
      [card.id]: {
        status: {
          ...card.status,
          ...statusChange,
        },
      },
    };
    globalUpdate.card = {
      ...globalUpdate.card,
      ...cardUpdate,
    };
    return globalUpdate;
  }
}
