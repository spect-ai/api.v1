import { InternalServerErrorException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CirclesRepository } from 'src/circle/circles.repository';
import { Circle } from 'src/circle/model/circle.model';
import { AddSafeCommand } from '../impl';

@CommandHandler(AddSafeCommand)
export class AddSafeCommandHandler implements ICommandHandler<AddSafeCommand> {
  constructor(private readonly circlesRepository: CirclesRepository) {}

  async execute(command: AddSafeCommand): Promise<Circle> {
    try {
      const { circle, id, safeDto } = command;
      console.log(safeDto);
      let circleToUpdate = circle;
      if (!circleToUpdate) {
        circleToUpdate = await this.circlesRepository.findById(id);
      }
      if (!circleToUpdate) {
        throw new InternalServerErrorException('Circle not found');
      }
      if (!circleToUpdate.safeAddresses) {
        circleToUpdate.safeAddresses = {};
      }
      console.log(circleToUpdate.safeAddresses);
      console.log(safeDto);
      if (circleToUpdate.safeAddresses[safeDto.chainId]) {
        if (
          !circleToUpdate.safeAddresses[safeDto.chainId].includes(
            safeDto.address,
          )
        ) {
          circleToUpdate.safeAddresses[safeDto.chainId].push(safeDto.address);
        }
      } else {
        circleToUpdate.safeAddresses[safeDto.chainId] = [safeDto.address];
      }

      const updatedCircle = await this.circlesRepository.updateById(
        circleToUpdate.id,
        {
          safeAddresses: {
            ...circleToUpdate.safeAddresses,
            [safeDto.chainId]: circleToUpdate.safeAddresses[safeDto.chainId],
          },
        },
      );
      return updatedCircle;
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }
}
