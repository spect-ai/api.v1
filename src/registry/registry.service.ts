import { Injectable } from '@nestjs/common';
import { CommonTools } from 'src/common/common.service';
import { AddNewNetworkDto } from './dto/add-new-network.dto';
import { AddNewTokenDto } from './dto/add-new-token.dto';
import { RegistryResponseDto } from './dto/detailed-registry-response.dto';
import { Registry, TokenInfo } from './model/registry.model';
import { RegistryRepository } from './registry.repository';
@Injectable()
export class RegistryService {
  constructor(
    private readonly registryRepository: RegistryRepository,
    private readonly commonTools: CommonTools,
  ) {}

  async getProvider(chainId: string): Promise<any> {
    const network = await this.registryRepository.findOne({
      chainId,
    });
    if (!network) {
      throw new Error('Network not found');
    }
    return network.provider;
  }

  async getRegistry(): Promise<RegistryResponseDto> {
    const networks = await this.registryRepository.findAll();
    const res = this.commonTools.objectify(
      networks,
      'chainId',
    ) as RegistryResponseDto;
    return res;
  }

  async addNetwork(addNetworkDto: AddNewNetworkDto) {
    return await this.registryRepository.create({
      ...addNetworkDto,
      tokenDetails: {
        '0x0': {
          address: '0x0',
          symbol: addNetworkDto.nativeCurrency,
          name: addNetworkDto.nativeCurrencyName,
        },
      },
    });
  }

  async addToken(addTokenkDto: AddNewTokenDto) {
    const network = await this.registryRepository.findOne({
      chainId: addTokenkDto.chainId,
    });

    return await this.registryRepository.updateByFilter(
      {
        chainId: addTokenkDto.chainId,
      },
      {
        ...network,
        tokenDetails: {
          ...network.tokenDetails,
          [addTokenkDto.address]: {
            address: addTokenkDto.address,
            symbol: addTokenkDto.symbol,
            name: addTokenkDto.name,
          } as TokenInfo,
        },
      },
    );
  }
}
