import { Injectable, InternalServerErrorException } from '@nestjs/common';
import fetch from 'node-fetch';
import { LoggingService } from 'src/logging/logging.service';

@Injectable()
export class LensService {
  constructor(private readonly logger: LoggingService) {
    this.logger.setContext('LensService');
  }

  async getLensProfilesByAddress(userAddress: string) {
    try {
      const multipleProfileData = JSON.stringify({
        query: `query Profile {
          profiles(request: { ownedBy: ["${userAddress}"] }) {
           items { id
            name
            bio           
            handle
            attributes {
              displayType
              traitType
              key
              value
            }
          }}
        }        
        `,
      });
      const res = await fetch('https://api.lens.dev', {
        method: 'POST',
        body: multipleProfileData,
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (res.ok) {
        const data = await res.json();
        return data;
      }
      return null;
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException(
        'Failed getting profiles with ethaddress with error ${e.message}',
      );
    }
  }

  async getLensProfile(handle: string) {
    try {
      const singleProfileData = JSON.stringify({
        query: ` query Profile {
          profile(request: { handle: ${handle} }) {
          id
            name
            bio
            handle
            attributes {
              displayType
              traitType
              key
              value
            }
            ownedBy
            }}`,
      });
      const res = await fetch('https://api.lens.dev', {
        method: 'POST',
        body: singleProfileData,
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (res.ok) {
        const data = await res.json();
        return data;
      }
      return null;
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException(
        'Failed getting profile with error ${e.message}',
      );
    }
  }
}
