import {
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { AddNewTokenDto } from 'src/registry/dto/add-new-token.dto';
import { TokenInfo } from 'src/registry/model/registry.model';
import { RegistryRepository } from 'src/registry/registry.repository';
import { RegistryService } from 'src/registry/registry.service';
import { RequestProvider } from 'src/users/user.provider';
import { CirclesRepository } from './circles.repository';
import { UpdateBlacklistDto } from './dto/update-local-registry.dto';
import { LoggingService } from 'src/logging/logging.service';

@Injectable()
export class CircleRegistryService {
  constructor(
    private readonly circlesRepository: CirclesRepository,
    private readonly registryRepository: RegistryRepository,
    private readonly registryService: RegistryService,
    private readonly requestProvider: RequestProvider,
    private readonly logger: LoggingService,
  ) {
    logger.setContext('CircleRegistryService');
  }

  async getPaymentMethods(slug: string) {
    try {
      const circle =
        await this.circlesRepository.getCircleWithUnpopulatedReferencesBySlug(
          slug,
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
        this.requestProvider,
      );
      throw new InternalServerErrorException(
        'Failed while getting payment method',
        error.message,
      );
    }
  }

  async addToken(id: string, addTokenDto: AddNewTokenDto) {
    try {
      const circle =
        this.requestProvider.circle ||
        (await this.circlesRepository.findById(id));
      if (!circle) {
        throw new HttpException('Circle not found', HttpStatus.NOT_FOUND);
      }

      const network = await this.registryRepository.findOne({
        chainId: addTokenDto.chainId,
      });
      if (!network)
        throw new HttpException('Invalid network', HttpStatus.NOT_FOUND);
      const localRegistry = circle.localRegistry || {};
      if (!(addTokenDto.chainId in localRegistry))
        localRegistry[addTokenDto.chainId] = { tokenDetails: {} };

      localRegistry[addTokenDto.chainId].tokenDetails = {
        ...localRegistry[addTokenDto.chainId].tokenDetails,
        [addTokenDto.address]: {
          symbol: addTokenDto.symbol,
          name: addTokenDto.name,
          address: addTokenDto.address,
        } as TokenInfo,
      };

      const updatedCircle = await this.circlesRepository.updateByFilter(
        {
          _id: id,
        },
        {
          ...circle,
          localRegistry: localRegistry,
        },
      );

      return await this.getPaymentMethods(circle.slug);
    } catch (error) {
      this.logger.logError(
        `Failed while adding token to circle with error: ${error.message}`,
        this.requestProvider,
      );
      throw new InternalServerErrorException(
        'Failed while adding token to circle',
        error.message,
      );
    }
  }

  async updateBlacklist(
    id: string,
    updateLocalRegistryDto: UpdateBlacklistDto,
  ) {
    try {
      const circle =
        this.requestProvider.circle ||
        (await this.circlesRepository.findById(id));

      if (!circle) {
        throw new HttpException('Circle not found', HttpStatus.NOT_FOUND);
      }

      if (!circle.blacklistRegistry) circle.blacklistRegistry = {};

      if (!(updateLocalRegistryDto.chainId in circle.blacklistRegistry))
        circle.blacklistRegistry[updateLocalRegistryDto.chainId] = {};
      circle.blacklistRegistry[updateLocalRegistryDto.chainId][
        updateLocalRegistryDto.tokenAddress
      ] = updateLocalRegistryDto.action === 'blacklist' ? true : false;

      return await this.circlesRepository.updateByFilter(
        {
          _id: id,
        },
        {
          ...circle,
          blacklistRegistry: circle.blacklistRegistry,
        },
      );
    } catch (error) {
      this.logger.logError(
        `Failed while updating circle blacklist with error: ${error.message}`,
        this.requestProvider,
      );
      throw new InternalServerErrorException(
        'Failed while updating circle blacklist',
        error.message,
      );
    }
  }
}
