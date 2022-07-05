import { Injectable } from '@nestjs/common';
import { CardsRepository } from 'src/card/cards.repository';
import { CardsService } from 'src/card/cards.service';
import { UpdateCardRequestDto } from 'src/card/dto/update-card-request.dto';
import { Card } from 'src/card/model/card.model';
import { CardsProjectService } from 'src/project/cards.project.service';
import { Project } from 'src/project/model/project.model';
import { ProjectsRepository } from 'src/project/project.repository';
import { ProjectService } from 'src/project/project.service';

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

  async executeAutomation(
    card: Card,
    project: Project,
    req: UpdateCardRequestDto,
  ) {
    let query = this.projectRepository.updateOneByIdQuery(project._id, {});
    console.log(query);
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
                    query = await this.executeColumnChange(
                      card,
                      project,
                      {
                        to: (actionValue as ColumnChangeAction).to,
                      },
                      query,
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
                  query = await this.executeStatusChange(
                    card,
                    actionValue as StatusChangeAction,
                    query,
                  );
                }
              }
            }
          }
        }
      }
    }

    return query;
  }

  async executeColumnChange(
    card: Card,
    project: Project,
    columnChange: ColumnChangeAction,
    query: any,
  ) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    query.updateOne.update = await this.cardProjectService.reorderCard(
      project.id,
      card.id,
      {
        destinationColumnId: columnChange.to,
        destinationCardIndex: columnChange.index ? columnChange.index : 0,
      },
      query.updateOne.update,
    );

    console.log(query);
    return query;
  }

  async executeStatusChange(
    card: Card,
    statusChange: StatusChangeAction,
    query: any,
  ) {
    query.updateOne.update = this.cardRepository.addToUpdateOneQuery(
      query.updateOne.update,
      {
        status: {
          ...card.status,
          ...statusChange,
        },
      },
    );

    console.log(query);
    return query;
  }
}
