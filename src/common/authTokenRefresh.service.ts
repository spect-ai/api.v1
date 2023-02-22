import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { LoggingService } from 'src/logging/logging.service';

@Injectable()
export class AuthTokenRefreshService {
  constructor(private readonly logger: LoggingService) {
    this.logger.setContext(AuthTokenRefreshService.name);
  }

  @Cron(CronExpression.EVERY_12_HOURS)
  handleCron() {
    fetch('https://poapauth.auth0.com/oauth/token', {
      body: JSON.stringify({
        client_id: process.env.POAP_CLIENT_ID,
        client_secret: process.env.POAP_CLIENT_SECRET,
        audience: 'Spect',
        grant_type: 'client_credentials',
      }),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    }).then(async (res) => {
      const data = await res.json();
      process.env.BEARER_TOKEN = data.access_token;
    });
  }
}
