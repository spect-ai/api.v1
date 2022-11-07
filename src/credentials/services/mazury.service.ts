import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { LoggingService } from 'src/logging/logging.service';
import fetch from 'node-fetch';

@Injectable()
export class MazuryService {
  constructor(private readonly logger: LoggingService) {
    this.logger.setContext('MazuryService');
  }

  async getBySearchTerm(searchTerm: string) {
    try {
      const qParams = {
        query: searchTerm,
        limit: '20',
        offset: '0',
      };
      const qs = '?' + new URLSearchParams(qParams).toString();

      const res = await fetch(
        `${process.env.MAZURY_URL}/search/search-es/${qs}`,
      );
      console.log(res);
      if (res.ok) {
        const json = await res.json();
        return json;
      }
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException(
        `Failed to get Mazury data with error ${e}`,
      );
    }
  }

  async getCredentials(ownerAddress: string, issuer: string) {
    try {
      const res = await fetch(
        `${process.env.MAZURY_URL}/badges?owner=${ownerAddress}&issuer=${issuer}`,
      );
      if (res.ok) {
        const json = await res.json();
        return json;
      }
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException(
        `Failed to get Mazury data with error ${e}`,
      );
    }
  }
}
