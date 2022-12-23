import { InternalServerErrorException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CirclesRepository } from 'src/circle/circles.repository';
import { Circle } from 'src/circle/model/circle.model';
import { LoggingService } from 'src/logging/logging.service';
import { RemoveSafeCommand } from '../impl';

@CommandHandler(RemoveSafeCommand)
export class RemoveSafeCommandHandler
  implements ICommandHandler<RemoveSafeCommand>
{
  constructor(
    private readonly circlesRepository: CirclesRepository,
    private readonly logger: LoggingService,
  ) {
    this.logger.setContext(RemoveSafeCommandHandler.name);
  }

  async execute(command: RemoveSafeCommand): Promise<Circle> {
    try {
      const { circle, id, safeDto } = command;
      let circleToUpdate = circle;
      if (!circleToUpdate) {
        circleToUpdate = await this.circlesRepository.findById(id);
      }
      if (!circleToUpdate) {
        throw new InternalServerErrorException('Circle not found');
      }

      if (
        !circleToUpdate.safeAddresses ||
        !circleToUpdate.safeAddresses[safeDto.chainId]
      ) {
        throw new InternalServerErrorException('Safe not found');
      }
      const safeAddresses = {
        ...circleToUpdate.safeAddresses,
        [safeDto.chainId]: circleToUpdate.safeAddresses[safeDto.chainId].filter(
          (address) => address !== safeDto.address,
        ),
      };

      const updatedCircle =
        await this.circlesRepository.updateCircleAndReturnWithPopulatedReferences(
          circleToUpdate.id,
          {
            safeAddresses,
          },
        );
      return updatedCircle;
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException(error.message);
    }
  }
}
