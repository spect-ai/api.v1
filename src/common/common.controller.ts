import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { GasPredictionService } from './gas-prediction.service';

@Controller('common')
@ApiTags('common')
export class CommonController {
  constructor(private readonly gasPredictionService: GasPredictionService) {}

  @Get('/gasPrediction')
  async gasPrediction(@Query() param: any) {
    return await this.gasPredictionService.predictGas(param.chainId);
  }
}
