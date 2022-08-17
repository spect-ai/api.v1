import { InternalServerErrorException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CirclesRepository } from 'src/circle/circles.repository';
import { DetailedCircleResponseDto } from 'src/circle/dto/detailed-circle-response.dto';
import { Circle } from 'src/circle/model/circle.model';
import { defaultCircleCreatorRoles } from 'src/constants';
import { LoggingService } from 'src/logging/logging.service';
import { ClaimCircleCommand } from '../impl/claim-circle.command';

@CommandHandler(ClaimCircleCommand)
export class ClaimCircleCommandHandler
  implements ICommandHandler<ClaimCircleCommand>
{
  constructor(
    private readonly circlesRepository: CirclesRepository,
    private readonly logger: LoggingService,
  ) {
    this.logger.setContext('ClaimCircleCommandHandler');
  }

  async execute(
    command: ClaimCircleCommand,
  ): Promise<DetailedCircleResponseDto | boolean> {
    try {
      const { id, caller } = command;
      const circle =
        await this.circlesRepository.getCircleWithUnpopulatedReferences(id);
      if (!circle) {
        throw new InternalServerErrorException('Circle not found');
      }

      if (!circle.toBeClaimed || !circle.qualifiedClaimee) {
        throw new InternalServerErrorException('Circle cannot be claimed');
      }
      console.log(circle.qualifiedClaimee);
      console.log(caller.ethAddress);

      if (circle.qualifiedClaimee) {
        for (const member of circle.qualifiedClaimee) {
          if (member.toLowerCase() === caller.ethAddress.toLowerCase()) {
            return await this.performClaim(circle, caller.id);
          }
        }
      }

      return false;
    } catch (error) {
      this.logger.error(error.message);
      throw new InternalServerErrorException(error);
    }
  }

  async performClaim(
    circle: Circle,
    callerId: string,
  ): Promise<DetailedCircleResponseDto> {
    const memberRoles = {};
    memberRoles[callerId] = defaultCircleCreatorRoles;
    return await this.circlesRepository.updateById(circle.id as string, {
      ...circle,
      members: [callerId],
      memberRoles: memberRoles,
      toBeClaimed: false,
    });
  }
}
