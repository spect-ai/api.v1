import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { LoggingService } from 'src/logging/logging.service';
import fetch from 'node-fetch';
import { EncryptionService } from './encryption.service';
import { SecretRepository } from 'src/secretRegistry/secret.repository';

@Injectable()
export class AuthTokenRefreshService {
  constructor(
    private readonly logger: LoggingService,
    private readonly encryptionService: EncryptionService,
    private readonly secretRepository: SecretRepository,
  ) {
    this.logger.setContext(AuthTokenRefreshService.name);
  }

  async getToken() {
    const encryptedToken = await this.secretRepository.findOne({
      key: 'POAP_ACCESS_TOKEN',
    });
    return this.encryptionService.decrypt(encryptedToken.value);
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
      const data = await res.json();
      const encryptedAccessToken = this.encryptionService.encrypt(
        data.access_token,
      );
      const hasPoapAccessToken = await this.secretRepository.findOne({
        key: 'POAP_ACCESS_TOKEN',
      });
      if (hasPoapAccessToken) {
        await this.secretRepository.updateByFilter(
          { key: 'POAP_ACCESS_TOKEN' },
          { value: encryptedAccessToken },
        );
      } else {
        await this.secretRepository.create({
          key: 'POAP_ACCESS_TOKEN',
          value: encryptedAccessToken,
        });
      }
    });
  }

  @Cron(CronExpression.EVERY_12_HOURS)
  handleCron() {
    this.updateToken();
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  fetchForm() {
    fetch(
      'https://circles.spect.network/r/3c3cab39-4ecf-4230-83cb-157954d5283d',
    )
      .then((res) => {
        console.log({ fetched: res.status });
      })
      .catch((err) => {
        console.log({ err });
      });
  }
}
