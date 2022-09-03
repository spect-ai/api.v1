import { Injectable, InternalServerErrorException } from '@nestjs/common';
import fetch from 'node-fetch';
import { CirclesPrivateRepository } from 'src/circle/circles-private.repository';
import { CirclesRepository } from 'src/circle/circles.repository';
import { LoggingService } from 'src/logging/logging.service';
import {
  ClaimKudosDto,
  KudosResponseDto,
  MintKudosDto,
} from './dtos/mint-kudos.dto';

export type nftTypes = {
  name: string;
  nftTypeId: string;
  previewAssetUrl: string;
  isUserAdded: boolean;
};
// TODO
@Injectable()
export class MintKudosService {
  constructor(
    private readonly logger: LoggingService,
    private readonly circlePrivateRepository: CirclesPrivateRepository,
  ) {
    this.logger.setContext('MintKudosService');
  }

  private async getPrivateProps(id: string): Promise<any> {
    const privateProps = await this.circlePrivateRepository.findOne({
      circleId: id,
    });
    if (!privateProps) {
      throw 'Circle doesnt have Mintkudos credentials setup';
    }
    return privateProps;
  }

  private async getEncodedString(id: string): Promise<string> {
    const privateProps = await this.getPrivateProps(id);
    return Buffer.from(
      privateProps.mintkudosCommunityId + ':' + privateProps.mintkudosApiKey,
    ).toString('base64');
  }

  async mintKudos(id: string, kudos: MintKudosDto): Promise<string> {
    try {
      const encodedString = await this.getEncodedString(id);
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

  async claimKudos(
    id: string,
    claimKudosDto: ClaimKudosDto,
  ): Promise<KudosResponseDto> {
    try {
      const encodedString = await this.getEncodedString(id);

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

  async getCommunityKudosDesigns(id: string): Promise<nftTypes> {
    const privateProps = await this.getPrivateProps(id);
    const encodedString = Buffer.from(
      privateProps.mintkudosCommunityId + ':' + privateProps.mintkudosApiKey,
    ).toString('base64');
    const res = await fetch(
      `${process.env.MINTKUDOS_URL}/v1/communities/${privateProps}/nftTypes`,
      {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Basic ${encodedString}`,
        },
      },
    );
    if (res.ok) {
      const nftTypes = await res.json();
      return nftTypes?.data;
    }
  }
}
