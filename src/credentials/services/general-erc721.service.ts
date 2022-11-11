import { Injectable } from '@nestjs/common';
import { LoggingService } from 'src/logging/logging.service';
import { Alchemy, Network } from 'alchemy-sdk';

@Injectable()
export class GeneralERC721Service {
  constructor(private readonly logger: LoggingService) {
    this.logger.setContext('GeneralSoulboundService');
  }
}
