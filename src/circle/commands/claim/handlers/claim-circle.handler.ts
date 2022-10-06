import { InternalServerErrorException } from '@nestjs/common';
import { CommandHandler, ICommandHandler, QueryBus } from '@nestjs/cqrs';
import { CirclesRepository } from 'src/circle/circles.repository';
import { CircleResponseDto } from 'src/circle/dto/detailed-circle-response.dto';
import { Circle, ExtendedCircle } from 'src/circle/model/circle.model';
import { GetCircleWithChildrenQuery } from 'src/circle/queries/impl';
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
    private readonly queryBus: QueryBus,
  ) {
    this.logger.setContext('ClaimCircleCommandHandler');
  }

  async execute(
    command: ClaimCircleCommand,
  ): Promise<CircleResponseDto | boolean> {
    try {
      const { id, caller } = command;
      const circle = await this.queryBus.execute(
        new GetCircleWithChildrenQuery(id),
      );
      console.log(id, caller.ethAddress);
      if (!circle) {
        throw new InternalServerErrorException('Circle not found');
      }

      if (!circle.toBeClaimed || !circle.qualifiedClaimee) {
        throw new InternalServerErrorException('Circle cannot be claimed');
      }
      if (circle.qualifiedClaimee) {
        for (const member of circle.qualifiedClaimee) {
          if (member.toLowerCase() === caller.ethAddress.toLowerCase()) {
            const res = await this.performClaim(circle, caller.id);
            console.log(res);
            return res;
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
    circle: ExtendedCircle,
    callerId: string,
  ): Promise<CircleResponseDto> {
    const memberRoles = {};
    memberRoles[callerId] = defaultCircleCreatorRoles;
    const allCircles = [circle, ...circle.flattenedChildren];
    const circleUpdate = {};
    for (const circle of allCircles) {
      circleUpdate[circle.id] = {
        ...circle,
        members: [callerId],
        memberRoles: memberRoles,
        toBeClaimed: false,
      };
    }
    await this.circlesRepository.bundleAndExecuteUpdates(circleUpdate);
    const updatedcircle =
      await this.circlesRepository.getCircleWithPopulatedReferences(circle.id);
    return await this.circlesRepository.getCircleWithMinimalDetails(
      updatedcircle,
    );
  }
}
