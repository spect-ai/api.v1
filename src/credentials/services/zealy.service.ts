import { Injectable } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { LoggingService } from 'src/logging/logging.service';
import fetch from 'node-fetch';
import { CirclesPrivateRepository } from 'src/circle/circles-private.repository';
import { ZealyUserType } from '../types/types';

@Injectable()
export class ZealyService {
  constructor(
    private readonly logger: LoggingService,
    private readonly commandBus: CommandBus,
    private readonly circlePrivateRepository: CirclesPrivateRepository,
  ) {
    this.logger.setContext('PoapService');
  }

  async getUser(
    circleId: string,
    discordId?: string,
    ethAddress?: string,
  ): Promise<ZealyUserType> {
    if (!discordId && !ethAddress) {
      throw new Error('No discordId or ethAddress provided');
    }
    const privateCreds = await this.circlePrivateRepository.findOne({
      circleId,
    });
    let url;
    if (discordId) {
      url = `https://api.zealy.io/communities/${privateCreds.zealySubdomain}/users?discordId=${discordId}`;
    } else if (ethAddress) {
      url = `https://api.zealy.io/communities/${privateCreds.zealySubdomain}/users?ethAddress=${ethAddress}`;
    }
    const res = await fetch(url, {
      headers: {
        accept: 'application/json',
        'x-api-key': privateCreds.zealyApiKey,
      },
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message);
    }
    return data;
  }

  async claimXp(
    circleId: string,
    userId: string,
    amount: number,
    label: string,
  ): Promise<any> {
    if (!userId) {
      throw new Error('No userId provided');
    }
    const privateCreds = await this.circlePrivateRepository.findOne({
      circleId,
    });

    console.log({
      amount,
      label,
    });
    const res = await fetch(
      `https://api.zealy.io/communities/${privateCreds.zealySubdomain}/users/${userId}/xp`,
      {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'content-type': 'application/json',
          'x-api-key': privateCreds.zealyApiKey,
        },
        body: JSON.stringify({
          xp: amount,
          label: label,
        }),
      },
    );

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message);
    }
    return data;
  }
}
