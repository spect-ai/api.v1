import { Injectable, InternalServerErrorException } from '@nestjs/common';
import fetch from 'node-fetch';
import { LoggingService } from 'src/logging/logging.service';
import {
  ClaimKudosDto,
  KudosResponseDto,
  MintKudosDto,
} from './dtos/mint-kudos.dto';

// TODO
@Injectable()
export class MintKudosService {
  constructor(private readonly logger: LoggingService) {
    this.logger.setContext('MintKudosService');
  }

  async mintKudos(kudos: MintKudosDto): Promise<string> {
    try {
      const encodedString = Buffer.from(
        process.env.MINTKUDOS_COMMUNITY_ID +
          ':' +
          process.env.MINTKUDOS_API_KEY,
      ).toString('base64');
      console.log(kudos);
      const res = await fetch(`${process.env.MINTKUDOS_URL}/v1/tokens`, {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Basic ${encodedString}`,
        },
        method: 'POST',
        body: JSON.stringify(kudos),
      });
      const operationId = res.headers.get('Location');
      return operationId;
    } catch (e) {
      this.logger.error(`Failed minting kudos with error ${e.message}`);
      console.log({ e });
      return e;
    }
  }

  async claimKudos(claimKudosDto: ClaimKudosDto): Promise<KudosResponseDto> {
    try {
      const encodedString = Buffer.from(
        process.env.MINTKUDOS_COMMUNITY_ID +
          ':' +
          process.env.MINTKUDOS_API_KEY,
      ).toString('base64');
      console.log(claimKudosDto);
      const res = await fetch(
        `${process.env.MINTKUDOS_URL}/v1/tokens/${claimKudosDto.tokenId}/claim`,
        {
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: `Basic ${encodedString}`,
          },
          method: 'POST',
          body: JSON.stringify({
            claimingAddress: claimKudosDto.claimingAddress,
            signature: claimKudosDto.signature,
          }),
        },
      );
      const operationId = res.headers.get('Location');
      return operationId;
    } catch (e) {
      this.logger.error(`Failed claiming kudos with error ${e.message}`);
      console.log({ e });
      return e;
    }
  }
}
