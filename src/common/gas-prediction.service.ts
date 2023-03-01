import { Injectable } from '@nestjs/common';
import fetch from 'node-fetch';

@Injectable()
export class GasPredictionService {
  async predictGas(chainId: string) {
    switch (chainId) {
      case '137':
        return await this.predictGasOnPolygon();
      case '1':
        return await this.predictGasOnEthereum();
      case '56':
        return await this.predictGasOnOther('bnb');
    }
  }

  async predictGasOnPolygon() {
    const response = await fetch('https://gasstation-mainnet.matic.network/v2');
    const data = await response.json();
    return data.fast;
  }

  async predictGasOnEthereum() {
    const response = await fetch(
      'https://ethgasstation.info/api/ethgasAPI.json',
    );
    const data = await response.json();
    return data.average;
  }

  async predictGasOnOther(chainShortName: string) {
    const response = await fetch(
      `https://api.owlracle.info/v3/${chainShortName}/gas?${process.env.OWLRACLE_GAS_ESTIMATOR_API_KEY}`,
    );
    const data = await response.json();
    return data.speeds;
  }
}
