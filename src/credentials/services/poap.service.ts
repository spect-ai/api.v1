import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { LoggingService } from 'src/logging/logging.service';
import { CreatePOAPDto } from '../dto/create-credential.dto';
import * as FormData from 'form-data';
import fetch from 'node-fetch';
import { Readable } from 'stream';

// TODO
@Injectable()
export class PoapService {
  constructor(private readonly logger: LoggingService) {
    this.logger.setContext('PoapService');
  }

  async createPoapEvent(
    createPoapDto: CreatePOAPDto,
    image: Express.Multer.File,
  ) {
    try {
      console.log({ lsls: createPoapDto.name });

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

  async getPoapById(id: string) {
    try {
      const options = {
        method: 'GET',
        headers: {
          accept: 'application/json',
          'x-api-key': process.env.POAP_API_KEY,
        },
      };

      return await (
        await fetch(`https://api.poap.tech/events/id/${id}`, options)
      ).json();
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException(
        `Failed to get POAP event with error ${e}`,
      );
    }
  }

  async claimQrCode(id: string, editCode: string) {
    try {
      const options = {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'content-type': 'application/json',
          authorization: `Bearer ${process.env.BEARER_TOKEN}`,
          'x-api-key': process.env.POAP_API_KEY,
        },
        body: JSON.stringify({
          secret_code: editCode,
        }),
      };

      return await (
        await fetch(`https://api.poap.tech/events/${id}/qr-codes`, options)
      ).json();
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException(
        `Failed to claim POAP QR code with error ${e}`,
      );
    }
  }

  async getActions(qrHash: string) {
    try {
      const options = {
        method: 'GET',
        headers: {
          accept: 'application/json',
          authorization: `Bearer ${process.env.BEARER_TOKEN}`,
          'x-api-key': process.env.POAP_API_KEY,
        },
      };

      return await (
        await fetch(
          `https://api.poap.tech/actions/claim-qr?qr-hash=${qrHash}`,
          options,
        )
      ).json();
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException(
        `Failed to get POAP actions with error ${e}`,
      );
    }
  }

  async claimPoap(claimCode: string, editCode: string, address: string) {
    try {
      console.log({
        claimCode,
        editCode,
        address,
      });
      const options = {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'content-type': 'application/json',
          'x-api-key': process.env.POAP_API_KEY,
        },
        body: JSON.stringify({
          secret: editCode,
          address,
          qr_hash: claimCode,
          sendEmail: true,
        }),
      };

      const res = await (
        await fetch(`https://api.poap.tech/actions/claim-qr`, options)
      ).json();
      console.log({ res });
      return res;
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException(
        `Failed to claim POAP with error ${e}`,
      );
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
        await fetch(`https://api.poap.tech//actions/scan/${address}`, options)
      ).json();
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException(
        `Failed to get POAPs by address with error ${e}`,
      );
    }
  }
}
