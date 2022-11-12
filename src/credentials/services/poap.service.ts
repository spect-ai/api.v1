import { Injectable } from '@nestjs/common';
import { LoggingService } from 'src/logging/logging.service';

// TODO
@Injectable()
export class PoapService {
  constructor(private readonly logger: LoggingService) {
    this.logger.setContext('PoapService');
  }

  async getPoaps() {
    return 'poaps';
  }
}
