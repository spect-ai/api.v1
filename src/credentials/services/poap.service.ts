import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { LoggingService } from 'src/logging/logging.service';
import { CreatePOAPDto } from '../dto/create-credential.dto';
import * as FormData from 'form-data';
import fetch from 'node-fetch';
import { Readable } from 'stream';
import { AuthTokenRefreshService } from 'src/common/authTokenRefresh.service';
import { CommandBus } from '@nestjs/cqrs';
import { GetSpaceCollectionsCommand } from 'src/circle/commands/impl';
import { Collection } from 'src/collection/model/collection.model';

// TODO
@Injectable()
export class PoapService {
  constructor(
    private readonly logger: LoggingService,
    private readonly authTokenService: AuthTokenRefreshService,
    private readonly commandBus: CommandBus,
  ) {
    this.logger.setContext('PoapService');
  }

  async createPoapEvent(
    createPoapDto: CreatePOAPDto,
    image: Express.Multer.File,
  ) {
    try {
      const editCode = Math.floor(100000 + Math.random() * 900000);
      const endDate = new Date(createPoapDto.endDate);
      const expiryDate = new Date(endDate.setDate(endDate.getDate() + 360))
        .toJSON()
        .slice(0, 10);

      const form = new FormData();
      form.append('virtual_event', createPoapDto.virtual);
      form.append('private_event', 'true');
      form.append('image', Readable.from(image.buffer), {
        filename: image.originalname,
      });
      form.append('expiry_date', expiryDate);
      form.append('name', createPoapDto.name);
      form.append('description', createPoapDto.description);
      form.append('city', createPoapDto.city);
      form.append('country', createPoapDto.country);
      form.append('end_date', createPoapDto.endDate);
      form.append('start_date', createPoapDto.startDate);
      form.append('event_url', createPoapDto.eventUrl);
      form.append('secret_code', editCode);
      form.append('email', createPoapDto.email);
      form.append('requested_codes', createPoapDto.requestedCodes);

      console.log('creating poap event');
      const res = await (
        await fetch(`https://api.poap.tech/events`, {
          method: 'POST',
          headers: {
            'x-api-key': process.env.POAP_API_KEY,
          },
          body: form,
        })
      ).json();

      if (res.error) {
        throw `${res}`;
      }
      return {
        ...res,
        editCode,
      };
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException(
        `Failed to create POAP event with error ${JSON.stringify(e.message)}`,
      );
    }
  }

  async getPoapById(id: string, address?: string) {
    try {
      const options = {
        method: 'GET',
        headers: {
          accept: 'application/json',
          'x-api-key': process.env.POAP_API_KEY,
        },
      };

      const res = await (
        await fetch(`https://api.poap.tech/events/id/${id}`, options)
      ).json();
      let claimed;
      if (address) {
        const hasPoapAlreadyRes = await this.hasPoap(address, id);
        if (hasPoapAlreadyRes.statusCode !== 404) {
          claimed = true;
        }
      }
      return {
        ...res,
        claimed,
      };
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException(
        `Failed to get POAP event with error ${e}`,
      );
    }
  }

  async getPoapInfoById(id: string) {
    try {
      const options = {
        method: 'GET',
        headers: {
          accept: 'application/json',
          'x-api-key': process.env.POAP_API_KEY,
        },
      };

      const res = await (
        await fetch(`https://api.poap.tech/events/id/${id}`, options)
      ).json();
      return res;
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException(
        `Failed to get POAP event with error ${e}`,
      );
    }
  }

  async claimQrCode(id: string, editCode: string) {
    try {
      const accessToken = await this.authTokenService.getToken();

      const options = {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'content-type': 'application/json',
          authorization: `Bearer ${accessToken}`,
          'x-api-key': process.env.POAP_API_KEY,
        },
        body: JSON.stringify({
          secret_code: editCode,
        }),
      };

      return await (
        await fetch(`https://api.poap.tech/event/${id}/qr-codes`, options)
      ).json();
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException(
        `Failed to claim POAP QR code with error ${e}`,
      );
    }
  }

  async getClaimInfo(qrHash: string) {
    try {
      const accessToken = await this.authTokenService.getToken();

      const options = {
        method: 'GET',
        headers: {
          accept: 'application/json',
          authorization: `Bearer ${accessToken}`,
          'x-api-key': process.env.POAP_API_KEY,
        },
      };

      const res = await fetch(
        `https://api.poap.tech/actions/claim-qr?qr_hash=${qrHash}`,
        options,
      );
      return await res.json();
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException(
        `Failed to get POAP actions with error ${e}`,
      );
    }
  }

  async claimPoap(poapEventId: string, editCode: string, address: string) {
    try {
      const hasPoapAlreadyRes = await this.hasPoap(address, poapEventId);
      if (hasPoapAlreadyRes.statusCode !== 404) {
        throw `User ${address} already has a POAP for event ${poapEventId}`;
      }

      const qrHashes = await this.claimQrCode(poapEventId, editCode);
      if (!qrHashes?.length) {
        throw `QR hashes not foudn for event ${poapEventId}`;
      }
      const unclaimedQrHash = qrHashes.find((qrHash) => !qrHash.claimed);

      if (!unclaimedQrHash) {
        throw `All Poaps have been claimed for event ${poapEventId}`;
      }
      const claimInfo = await this.getClaimInfo(unclaimedQrHash.qr_hash);
      if (!claimInfo) {
        throw `Failed to get claim info for event ${poapEventId}`;
      }
      const accessToken = await this.authTokenService.getToken();

      const claimSecret = claimInfo.secret;
      const options = {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'content-type': 'application/json',
          authorization: `Bearer ${accessToken}`,
          'x-api-key': process.env.POAP_API_KEY,
        },
        body: JSON.stringify({
          secret: claimSecret,
          address,
          qr_hash: unclaimedQrHash.qr_hash,
          sendEmail: true,
        }),
      };

      const res = await (
        await fetch(`https://api.poap.tech/actions/claim-qr`, options)
      ).json();
      return res;
    } catch (e) {
      this.logger.error(`Failed to claim POAP with error ${e}`);
      throw e;
    }
  }

  async hasPoap(address: string, eventId: string) {
    try {
      const options = {
        method: 'GET',
        headers: {
          accept: 'application/json',
          'x-api-key': process.env.POAP_API_KEY,
        },
      };

      return await (
        await fetch(
          `https://api.poap.tech/actions/scan/${address}/${eventId}`,
          options,
        )
      ).json();
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException(
        `Failed to check if user has POAP with error ${e}`,
      );
    }
  }

  async getPoapsByAddress(address: string) {
    try {
      const options = {
        method: 'GET',
        headers: {
          accept: 'application/json',
          'x-api-key': process.env.POAP_API_KEY,
        },
      };

      return await (
        await fetch(`https://api.poap.tech/actions/scan/${address}`, options)
      ).json();
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException(
        `Failed to get POAPs by address with error ${e}`,
      );
    }
  }

  async getSpacePoaps(spaceId: string) {
    const res = await this.commandBus.execute(
      new GetSpaceCollectionsCommand(spaceId),
    );
    const spacePoaps = [];
    for await (const collection of res as Collection[]) {
      if (collection.formMetadata?.poapEventId) {
        const poap = await this.getPoapInfoById(
          collection.formMetadata.poapEventId,
        );
        spacePoaps.push({
          event: {
            ...poap,
          },
        });
      }
    }

    return spacePoaps;
  }

  async validateSecretCode(poapEventId: string, editCode: string) {
    try {
      const accessToken = await this.authTokenService.getToken();

      const options = {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'content-type': 'application/json',
          authorization: `Bearer ${accessToken}`,
          'x-api-key': process.env.POAP_API_KEY,
        },
        body: JSON.stringify({
          event_id: poapEventId,
          secret_code: editCode,
        }),
      };

      const res = await fetch(`https://api.poap.tech/event/validate`, options);
      return await res.json();
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException(
        `Failed to validate secret code with error ${e}`,
      );
    }
  }
}
