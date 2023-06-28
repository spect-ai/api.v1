import { InternalServerErrorException } from '@nestjs/common';
import {
  CommandBus,
  CommandHandler,
  EventBus,
  ICommandHandler,
} from '@nestjs/cqrs';
import { CirclesRepository } from 'src/circle/circles.repository';
import { DetailedCircleResponseDto } from 'src/circle/dto/detailed-circle-response.dto';
import { CreatedCircleEvent } from 'src/circle/events/impl';
import { Circle } from 'src/circle/model/circle.model';
import { SlugService } from 'src/common/slug.service';
import { defaultCircleCreatorRoles, defaultCircleRoles } from 'src/constants';
import { RolesService } from 'src/roles/roles.service';
import { CreateFolderCommand } from '../impl';
import { CreateCircleCommand } from '../impl/create-circle.command';

@CommandHandler(CreateCircleCommand)
export class CreateCircleCommandHandler
  implements ICommandHandler<CreateCircleCommand>
{
  constructor(
    private readonly circlesRepository: CirclesRepository,
    private readonly commandBus: CommandBus,
    private readonly slugService: SlugService,
    private readonly roleService: RolesService,
    private readonly eventBus: EventBus,
  ) {}

  async execute(
    command: CreateCircleCommand,
  ): Promise<DetailedCircleResponseDto> {
    try {
      const { createCircleDto, caller } = command;
      const slug = await this.slugService.generateUniqueSlug(
        createCircleDto.name,
        this.circlesRepository,
      );

      let parentCircle: Circle;
      if (createCircleDto.parent) {
        parentCircle =
          await this.circlesRepository.getCircleWithUnpopulatedReferences(
            createCircleDto.parent,
          );

        if (parentCircle.pricingPlan === 0) {
          throw new InternalServerErrorException(
            'You cannot create a workstream in the free plan, please upgrade to a paid plan.',
          );
        }
      }
      let createdCircle: Circle;
      const memberRoles = {};
      memberRoles[caller.id] = defaultCircleCreatorRoles;
      if (parentCircle) {
        createdCircle = await this.circlesRepository.create({
          ...createCircleDto,
          slug: slug,
          parents: [parentCircle._id],
          members: [caller.id],
          memberRoles: memberRoles,
          roles: defaultCircleRoles,
          localRegistry: {},
          sidebarConfig: {
            showAutomation: true,
            showGovernance: false,
            showMembership: true,
            showPayment: false,
            showDiscussion: false,
          },
          pricingPlan: parentCircle.pricingPlan,
          topUpMembers: parentCircle.topUpMembers,
          referredBy: caller.referredBy,
          monthsOfSubscription: parentCircle.monthsOfSubscription,
        });
        await this.circlesRepository.updateById(parentCircle.id as string, {
          ...parentCircle,
          children: [...parentCircle.children, createdCircle],
        });
        createdCircle = await this.commandBus.execute(
          new CreateFolderCommand(createdCircle.id, {
            name: 'Folder-0',
            avatar: 'All',
            contentIds: [],
          }),
        );
      } else {
        createdCircle = await this.circlesRepository.create({
          ...createCircleDto,
          slug: slug,
          members: [caller.id],
          memberRoles: memberRoles,
          roles: defaultCircleRoles,
          localRegistry: {},
          sidebarConfig: {
            showAutomation: true,
            showGovernance: false,
            showMembership: true,
            showPayment: false,
            showDiscussion: false,
          },
          pricingPlan: 0,
          topUpMembers: 0,
          referredBy: caller.referredBy,
          monthsOfSubscription: 0,
        });
      }

      this.eventBus.publish(new CreatedCircleEvent(createdCircle, caller.id));

      return createdCircle;
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }
}
