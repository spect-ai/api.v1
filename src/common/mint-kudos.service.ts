import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import fetch from 'node-fetch';
import { CirclesPrivateRepository } from 'src/circle/circles-private.repository';
import { CirclesRepository } from 'src/circle/circles.repository';
import { GetPrivateCircleByCircleIdQuery } from 'src/circle/queries/impl';
import { LoggingService } from 'src/logging/logging.service';
import {
  ClaimKudosDto,
  KudosResponseDto,
  MintKudosDto,
} from './dtos/mint-kudos.dto';
import { v4 as uuidv4 } from 'uuid';
import * as FormData from 'form-data';
import { Express } from 'express';
import { Multer } from 'multer';

export type nftTypes = {
  name: string;
  nftTypeId: string;
  previewAssetUrl: string;
  isUserAdded: boolean;
};

export type AddedNFTTypeResponse = {
  name: string;
  nftTypeId: string;
  assetUrl: string;
};
import { Readable } from 'stream';

// TODO
@Injectable()
export class MintKudosService {
  constructor(
    private readonly logger: LoggingService,
    private readonly queryBus: QueryBus,
  ) {
    this.logger.setContext('MintKudosService');
  }

  private async getPrivateProps(id: string): Promise<any> {
    const privateProps = await this.queryBus.execute(
      new GetPrivateCircleByCircleIdQuery(id),
    );
    if (!privateProps) {
      throw 'Circle doesnt have Mintkudos credentials setup';
    }
    return privateProps;
  }

  private async getEncodedString(id: string): Promise<string> {
    const privateProps = await this.getPrivateProps(id);
    const stringToEncode =
      privateProps.mintkudosCommunityId + ':' + privateProps.mintkudosApiKey;
    return Buffer.from(stringToEncode).toString('base64');
  }

  async mintKudos(id: string, kudos: MintKudosDto): Promise<string> {
    try {
      const encodedString = await this.getEncodedString(id);
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
      console.log(res);
      const data = await res.json();
      console.log(data);
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

  async airdropKudos(
    circleId: string,
    tokenId: string,
    ethAddress: string,
  ): Promise<KudosResponseDto> {
    console.log(circleId);
    const privateProps = await this.getPrivateProps(circleId);
    const encodedString = Buffer.from(
      privateProps.mintkudosCommunityId + ':' + privateProps.mintkudosApiKey,
    ).toString('base64');
    const res = await fetch(
      `${process.env.MINTKUDOS_URL}/v1/tokens/${tokenId}/airdrop`,
      {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Basic ${encodedString}`,
        },
        method: 'POST',
        body: JSON.stringify({
          address: ethAddress,
        }),
      },
    );
    console.log(res);
    const operationId = res.headers.get('Location');
    return operationId;
  }

  async getCommunityKudosDesigns(id: string): Promise<nftTypes> {
    const privateProps = await this.getPrivateProps(id);
    const encodedString = Buffer.from(
      privateProps.mintkudosCommunityId + ':' + privateProps.mintkudosApiKey,
    ).toString('base64');
    const res = await fetch(
      `${process.env.MINTKUDOS_URL}/v1/communities/${privateProps.mintkudosCommunityId}/nftTypes`,
      {
        headers: {
          Accept: 'application/form-data',
          'Content-Type': 'application/form-data',
          Authorization: `Basic ${encodedString}`,
        },
      },
    );
    if (res.ok) {
      const nftTypes = await res.json();
      return nftTypes?.data;
    }
  }

  async addNewCommunityDesign(
    circleId: string,
    asset: Express.Multer.File,
  ): Promise<AddedNFTTypeResponse> {
    const privateProps = await this.getPrivateProps(circleId);
    const encodedString = Buffer.from(
      privateProps.mintkudosCommunityId + ':' + privateProps.mintkudosApiKey,
    ).toString('base64');

    const nftTypeId = uuidv4();
    console.log('here1');

    const formData = new FormData();

    // formData.append('nftTypeId', nftTypeId);
    // formData.append('assetFile', asset);
    // formData.append('name', 'test123.png');
    formData.append('assetFile', Readable.from(asset.buffer), {
      filename: asset.originalname,
    });
    formData.append('name', asset.originalname);
    formData.append('nftTypeId', nftTypeId);
    console.log('here2');
    console.log(privateProps);

    const res = await (
      await fetch(
        `${process.env.MINTKUDOS_URL}/v1/communities/${privateProps.mintkudosCommunityId}/nftTypes`,
        {
          method: 'POST',
          headers: {
            Authorization: `Basic ${encodedString}`,
          },
          body: formData,
        },
      )
    ).json();
    return { ...res, nftTypeId, name: asset.originalname };
  }
}
