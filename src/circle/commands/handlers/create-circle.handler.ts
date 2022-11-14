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
import {
  CreateCircleCommand,
  CreateClaimableCircleCommand,
} from '../impl/create-circle.command';

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
          paymentAddress: caller.ethAddress,
        });
        await this.circlesRepository.updateById(parentCircle.id as string, {
          ...parentCircle,
          children: [...parentCircle.children, createdCircle],
        });
      } else {
        createdCircle = await this.circlesRepository.create({
          ...createCircleDto,
          slug: slug,
          members: [caller.id],
          memberRoles: memberRoles,
          roles: defaultCircleRoles,
          localRegistry: {},
        });
      }

      this.eventBus.publish(new CreatedCircleEvent(createdCircle, caller.id));

      return createdCircle;
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }
}

@CommandHandler(CreateClaimableCircleCommand)
export class CreateClaimableCircleCommandHandler
  implements ICommandHandler<CreateClaimableCircleCommand>
{
  constructor(
    private readonly circlesRepository: CirclesRepository,
    private readonly slugService: SlugService,
    private readonly eventBus: EventBus,
  ) {}

  async execute(
    command: CreateClaimableCircleCommand,
  ): Promise<DetailedCircleResponseDto> {
    try {
      const { createCircleDto } = command;
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
      }
      let createdCircle: Circle;
      if (parentCircle) {
        createdCircle = await this.circlesRepository.create({
          ...createCircleDto,
          slug: slug,
          parents: [parentCircle._id],
          roles: defaultCircleRoles,
          localRegistry: {},
          toBeClaimed: true,
        });
        await this.circlesRepository.updateById(parentCircle.id as string, {
          ...parentCircle,
          children: [...parentCircle.children, createdCircle],
        });
      } else {
        createdCircle = await this.circlesRepository.create({
          ...createCircleDto,
          slug: slug,
          roles: defaultCircleRoles,
          localRegistry: {},
          toBeClaimed: true,
        });
      }

      this.eventBus.publish(new CreatedCircleEvent(createdCircle, null));

      return createdCircle;
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }
}
