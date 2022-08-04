import { InternalServerErrorException } from '@nestjs/common';
import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CirclesRepository } from 'src/circle/circles.repository';
import { DetailedCircleResponseDto } from 'src/circle/dto/detailed-circle-response.dto';
import { Circle } from 'src/circle/model/circle.model';
import { SlugService } from 'src/common/slug.service';
import { RolesService } from 'src/roles/roles.service';
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
      memberRoles[caller] = [
        this.roleService.getDefaultUserRoleOnCircleCreation(),
      ];
      if (parentCircle) {
        createdCircle = await this.circlesRepository.create({
          ...createCircleDto,
          slug: slug,
          parents: [parentCircle._id],
          members: [caller],
          memberRoles: memberRoles,
          roles: this.roleService.defaultCircleRoles(),
          localRegistry: {},
        });
        await this.circlesRepository.updateById(parentCircle.id as string, {
          ...parentCircle,
          children: [...parentCircle.children, createdCircle],
        });
      } else {
        createdCircle = await this.circlesRepository.create({
          ...createCircleDto,
          slug: slug,
          members: [caller],
          memberRoles: memberRoles,
          roles: this.roleService.defaultCircleRoles(),
          localRegistry: {},
        });
      }

      return createdCircle;
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }
}
