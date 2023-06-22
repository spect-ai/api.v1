import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { LoggingService } from 'src/logging/logging.service';

@Injectable()
export class RateLimitCacheService {
  cache: {
    [userId: string]: number;
  } = {};

  refreshCache() {
    this.cache = {};
  }

  addOrIncrement(userId: string) {
    if (!this.cache[userId]) {
      this.cache[userId] = 1;
    } else {
      this.cache[userId] += 1;
    }
  }

  hasCrossedLimit(userId: string) {
    if (!this.cache[userId]) {
      return false;
    }
    return this.cache[userId] > 50;
  }

  @Cron(CronExpression.EVERY_10_SECONDS)
  handleCron() {
    this.refreshCache();
  }
}
