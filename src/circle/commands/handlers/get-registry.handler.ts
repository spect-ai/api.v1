import {
  HttpException,
  HttpStatus,
  InternalServerErrorException,
} from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CirclesRepository } from 'src/circle/circles.repository';
import { LoggingService } from 'src/logging/logging.service';
import { RegistryService } from 'src/registry/registry.service';
import { GetRegistryCommand } from '../impl/get-registry.command';

@CommandHandler(GetRegistryCommand)
export class GetRegistryCommandHandler
  implements ICommandHandler<GetRegistryCommand>
{
  constructor(
    private readonly circlesRepository: CirclesRepository,
    private readonly registryService: RegistryService,
    private readonly logger: LoggingService,
  ) {}

  async execute(command: GetRegistryCommand) {
    const { spaceId } = command;
    try {
      const circle =
        await this.circlesRepository.getCircleWithUnpopulatedReferences(
          spaceId,
        );

      if (!circle) {
        throw new HttpException('Circle not found', HttpStatus.NOT_FOUND);
      }
      /**
       * Get all the tokens from the global registry
       */
      const globalRegistry = await this.registryService.getRegistry();
      const blacklistRegistry = circle.blacklistRegistry;
      /**
       * Loop through all networks and tokens in global registry, this is mainly to sync global registry records
       * that were added after circle was created
       */
      if (!circle.localRegistry) circle.localRegistry = {};

      for (const [chainId, chain] of Object.entries(globalRegistry)) {
        if (!(chainId in circle.localRegistry))
          circle.localRegistry[chainId] = { tokenDetails: {} };
        circle.localRegistry[chainId] = {
          ...globalRegistry[chainId],
          ...circle.localRegistry[chainId],
        };
        circle.localRegistry[chainId].tokenDetails = {
          ...circle.localRegistry[chainId].tokenDetails,
          ...globalRegistry[chainId].tokenDetails,
        };
      }

      /**
       * Add if token is token is blacklisted
       */
      for (const [chainId, chain] of Object.entries(circle.localRegistry)) {
        for (const [tokenAddress, token] of Object.entries(
          chain.tokenDetails,
        )) {
          if (
            blacklistRegistry &&
            blacklistRegistry[chainId] &&
            blacklistRegistry[chainId][tokenAddress]
          ) {
            circle.localRegistry[chainId].tokenDetails[
              tokenAddress
            ].blacklisted = true;
          } else {
            circle.localRegistry[chainId].tokenDetails[
              tokenAddress
            ].blacklisted = false;
          }
        }
      }
      return circle.localRegistry;
    } catch (error) {
      this.logger.logError(
        `Failed while getting payment method with error: ${error.message}`,
      );
      throw new InternalServerErrorException(
        'Failed while getting payment method',
        error.message,
      );
    }
  }
}
