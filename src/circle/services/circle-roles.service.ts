import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { CommandBus, EventBus } from '@nestjs/cqrs';
import { LoggingService } from 'src/logging/logging.service';
import { RequestProvider } from 'src/users/user.provider';
import {
  AddRoleCommand,
  RemoveRoleCommand,
  UpdateRoleCommand,
} from '../commands/impl';
import { CircleResponseDto } from '../dto/detailed-circle-response.dto';
import { AddRoleDto } from '../dto/roles-requests.dto';
import { CirclesRepository } from 'src/circle/circles.repository';

@Injectable()
export class CirclesRolesService {
  constructor(
    private readonly requestProvider: RequestProvider,
    private readonly circleRepository: CirclesRepository,
    private readonly logger: LoggingService,
    private readonly commandBus: CommandBus,
    private readonly eventBus: EventBus,
  ) {
    logger.setContext('CirclesRolesService');
  }

  async addRole(id: string, roleDto: AddRoleDto): Promise<CircleResponseDto> {
    try {
      const circle = await this.commandBus.execute(
        new AddRoleCommand(roleDto, this.requestProvider.circle, id),
      );
      return await this.circleRepository.getCircleWithMinimalDetails(circle);
    } catch (error) {
      this.logger.logError(
        `Failed adding circle role with error: ${error.message}`,
        this.requestProvider,
      );
      throw new InternalServerErrorException(
        'Failed adding circle role',
        error.message,
      );
    }
  }

  async updateRole(
    id: string,
    roleId: string,
    roleDto: AddRoleDto,
  ): Promise<CircleResponseDto> {
    try {
      const circle = await this.commandBus.execute(
        new UpdateRoleCommand(roleId, roleDto, this.requestProvider.circle, id),
      );
      return await this.circleRepository.getCircleWithMinimalDetails(circle);
    } catch (error) {
      this.logger.logError(
        `Failed updating circle role with error: ${error.message}`,
        this.requestProvider,
      );
      throw new InternalServerErrorException(
        'Failed updating circle role',
        error.message,
      );
    }
  }

  async removeRole(id: string, roleId: string): Promise<CircleResponseDto> {
    try {
      const circle = await this.commandBus.execute(
        new RemoveRoleCommand(roleId, this.requestProvider.circle, id),
      );
      return await this.circleRepository.getCircleWithMinimalDetails(circle);
    } catch (error) {
      this.logger.logError(
        `Failed removing circle role with error: ${error.message}`,
        this.requestProvider,
      );
      throw new InternalServerErrorException(
        'Failed removing circle role',
        error.message,
      );
    }
  }
}
