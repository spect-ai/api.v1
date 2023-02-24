import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { LoggingService } from 'src/logging/logging.service';
import fetch from 'node-fetch';

@Injectable()
export class AuthTokenRefreshService {
  constructor(private readonly logger: LoggingService) {
    this.logger.setContext(AuthTokenRefreshService.name);
  }

  updateToken() {
    console.log('Updating token');
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
      console.log({ res });
      const data = await res.json();
      console.log({ data });
      process.env.BEARER_TOKEN = data.access_token;
    });
  }

  @Cron(CronExpression.EVERY_12_HOURS)
  handleCron() {
    this.updateToken();
  }
}
