import { Injectable } from '@nestjs/common';
import { ethers } from 'ethers';
import { surveyHubAbi } from 'src/common/abis/surveyHub';
import { readContract } from '@wagmi/core';
import { RegistryService } from 'src/registry/registry.service';
import { Registry } from 'src/registry/model/registry.model';
import { RegistryResponseDto } from 'src/registry/dto/detailed-registry-response.dto';
import { LoggingService } from 'src/logging/logging.service';

@Injectable()
export class SurveyTokenService {
  constructor(
    private readonly registryService: RegistryService,
    private readonly logger: LoggingService,
  ) {
    this.logger.setContext('SurveyTokenService');
  }

  async surveyProtocol(
    chainId: string,
    registry?: RegistryResponseDto,
  ): Promise<{
    registry: RegistryResponseDto;
    surveyProtocol: ethers.Contract;
  }> {
    const reg = registry || (await this.registryService.getRegistry());
    const provider = new ethers.providers.JsonRpcProvider(
      reg[chainId].provider,
    );
    const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

    return {
      registry: reg,
      surveyProtocol: new ethers.Contract(
        reg[chainId].surveyHubAddress,
        surveyHubAbi,
        signer,
      ),
    };
  }

  async getLastSurveyId(chainId: string, registry?: RegistryResponseDto) {
    const { registry: reg, surveyProtocol } = await this.surveyProtocol(
      chainId,
      registry,
    );
    const count = await surveyProtocol.surveyCount();
    return parseInt(ethers.utils.formatUnits(count as any, 0)) - 1;
  }

  async getSurveyDistributionInfo(
    chainId: string,
    surveyId: number,
    registry?: RegistryResponseDto,
  ) {
    const { registry: reg, surveyProtocol } = await this.surveyProtocol(
      chainId,
      registry,
    );
    return await surveyProtocol.distributionInfo(surveyId);
  }

  async getSurveyConditionInfo(
    chainId: string,
    surveyId: number,
    registry?: RegistryResponseDto,
  ) {
    const { registry: reg, surveyProtocol } = await this.surveyProtocol(
      chainId,
      registry,
    );
    return await surveyProtocol.conditionInfo(surveyId);
  }

  async hasClaimedSurveyReceipt(
    chainId: string,
    surveyId: number,
    callerAddress: string,
    registry?: RegistryResponseDto,
  ) {
    try {
      const { registry: reg, surveyProtocol } = await this.surveyProtocol(
        chainId,
        registry,
      );
      const res = await surveyProtocol.hasResponded(surveyId, callerAddress);
      return res;
    } catch (err) {
      console.log(err);
      return false;
    }
  }

  async hasClaimedSurveyToken(
    chainId: string,
    surveyId: number,
    callerAddress: string,
    registry?: RegistryResponseDto,
  ) {
    try {
      const { registry: reg, surveyProtocol } = await this.surveyProtocol(
        chainId,
        registry,
      );
      const res = await surveyProtocol.hasReceivedPayment(
        surveyId,
        callerAddress,
      );
      return res;
    } catch (err) {
      console.log(err);
      return false;
    }
  }

  async hasWonLottery(
    chainId: string,
    surveyId: number,
    callerAddress: string,
    registry?: RegistryResponseDto,
  ) {
    try {
      const { registry: reg, surveyProtocol } = await this.surveyProtocol(
        chainId,
        registry,
      );
      const res = await surveyProtocol.findLotteryWinner(surveyId);

      if (callerAddress === res) {
        return true;
      }
    } catch (err) {
      this.logger.logError(err);
      return false;
    }
  }

  async getEscrowBalance(
    chainId: string,
    surveyId: number,
    registry?: RegistryResponseDto,
  ) {
    const { registry: reg, surveyProtocol } = await this.surveyProtocol(
      chainId,
      registry,
    );
    const res = await surveyProtocol.escrowBalance(surveyId);

    return res;
  }

  async isEligibleToClaimSurveyToken(
    chainId: string,
    surveyId: number,
    callerAddress: string,
    distributionType: 0 | 1,
    registry?: RegistryResponseDto,
    requestId?: string,
  ): Promise<boolean> {
    const { registry: reg, surveyProtocol } = await this.surveyProtocol(
      chainId,
      registry,
    );

    if (distributionType === 0) {
      if (requestId === '0') return false;
      return await this.hasWonLottery(
        chainId,
        surveyId,
        callerAddress,
        registry,
      );
    } else
      return await this.hasClaimedSurveyReceipt(
        chainId,
        surveyId,
        callerAddress,
        registry,
      );
  }
}
