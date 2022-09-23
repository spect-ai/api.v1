import { InternalServerErrorException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CirclesRepository } from 'src/circle/circles.repository';
import { Circle } from 'src/circle/model/circle.model';
import { UpdateRoleCommand } from '../impl/update-role.command';
import { WhitelistMemberAddressCommand } from '../impl/whitelist-member-address.command';

@CommandHandler(WhitelistMemberAddressCommand)
export class WhitelistMemberAddressCommandHandler
  implements ICommandHandler<WhitelistMemberAddressCommand>
{
  constructor(private readonly circlesRepository: CirclesRepository) {}

  async execute(command: WhitelistMemberAddressCommand): Promise<Circle> {
    try {
      const { circle, id, address, roles } = command;
      let circleToUpdate = circle;
      if (!circleToUpdate) {
        circleToUpdate = await this.circlesRepository.findById(id);
      }
      if (!circleToUpdate) {
        throw new InternalServerErrorException('Circle not found');
      }
      const existingRoles = roles.map((r) => {
        if (circleToUpdate.roles && circleToUpdate.roles[r]) return r;
      });
      const updatedCircle =
        await this.circlesRepository.updateCircleAndReturnWithPopulatedReferences(
          circleToUpdate.id,
          {
            whitelistedMemberAddresses: {
              ...circleToUpdate.whitelistedMemberAddresses,
              [address]: existingRoles,
            },
          },
        );
      return updatedCircle;
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }
}
