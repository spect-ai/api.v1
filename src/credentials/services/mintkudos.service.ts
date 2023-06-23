import { Injectable } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import fetch from 'node-fetch';
import {
  GetCircleByIdQuery,
  GetPrivateCircleByCircleIdQuery,
} from 'src/circle/queries/impl';
import { LoggingService } from 'src/logging/logging.service';
import {
  ClaimKudosDto,
  KudosResponseDto,
  MintKudosDto,
} from '../dto/mint-kudos.dto';
import { v4 as uuidv4 } from 'uuid';
import * as FormData from 'form-data';
import { Credential } from 'src/users/types/types';

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
import { KudosType } from '../types/types';
import { UpdateCircleCommand } from 'src/circle/commands/impl/update-circle.command';
import { GetSpaceCollectionsCommand } from 'src/circle/commands/impl';
import { Collection } from 'src/collection/model/collection.model';

// TODO
@Injectable()
export class MintKudosService {
  constructor(
    private readonly logger: LoggingService,
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
  ) {
    this.logger.setContext('MintKudosService');
  }

  private async getPrivateProps(id: string): Promise<any> {
    const privateProps = await this.queryBus.execute(
      new GetPrivateCircleByCircleIdQuery(id),
    );
    return privateProps;
  }

  private async getEncodedString(id: string): Promise<string> {
    const privateProps = await this.getPrivateProps(id);
    let stringToEncode;
    if (
      !privateProps ||
      !privateProps.mintkudosApiKey ||
      !privateProps.mintkudosCommunityId
    ) {
      stringToEncode =
        process.env.MINTKUDOS_DEFAULT_COMMUNITY_ID +
        ':' +
        process.env.MINTKUDOS_DEFAULT_API_KEY;
      return Buffer.from(stringToEncode).toString('base64');
    } else
      stringToEncode =
        privateProps.mintkudosCommunityId + ':' + privateProps.mintkudosApiKey;
    return Buffer.from(stringToEncode).toString('base64');
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
      const data = await res.json();
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
  ): Promise<string> {
    const encodedString = await this.getEncodedString(circleId);
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
    if (res.ok) {
      const operationId = res.headers.get('Location');
      return operationId;
    } else {
      const error = await res.json();
      throw error;
    }
  }

  async getAllDesigns(): Promise<nftTypes[]> {
    const encodedString = Buffer.from(
      process.env.MINTKUDOS_DEFAULT_COMMUNITY_ID +
        ':' +
        process.env.MINTKUDOS_DEFAULT_API_KEY,
    ).toString('base64');
    const res = await fetch(
      `${process.env.MINTKUDOS_URL}/v1/communities/${process.env.MINTKUDOS_DEFAULT_COMMUNITY_ID}/nftTypes`,
      {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Basic ${encodedString}`,
        },
      },
    );
    if (!res.ok) {
      const error = await res.json();
      console.log({ error });
      throw error;
    }
    const nftTypes = await res.json();
    return nftTypes?.data;
  }

  async getCommunityKudosDesigns(id: string): Promise<nftTypes> {
    const privateProps = await this.getPrivateProps(id);
    if (privateProps) {
      const encodedString = Buffer.from(
        privateProps.mintkudosCommunityId + ':' + privateProps.mintkudosApiKey,
      ).toString('base64');
      const res = await fetch(
        `${process.env.MINTKUDOS_URL}/v1/communities/${privateProps.mintkudosCommunityId}/nftTypes`,
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
    } else {
      const encodedString = Buffer.from(
        process.env.MINTKUDOS_DEFAULT_COMMUNITY_ID +
          ':' +
          process.env.MINTKUDOS_DEFAULT_API_KEY,
      ).toString('base64');
      const res = await fetch(
        `${process.env.MINTKUDOS_URL}/v1/communities/${process.env.MINTKUDOS_DEFAULT_COMMUNITY_ID}/nftTypes`,
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
        const circle = await this.queryBus.execute(new GetCircleByIdQuery(id));
        const nftTypeIdSet = new Set(circle.nftTypeIds);
        const nftTypesFiltered = nftTypes?.data.filter(
          (nftType) =>
            nftTypeIdSet.has(nftType.nftTypeId) ||
            nftType.nftTypeId?.startsWith('default'),
        );

        return nftTypesFiltered;
      }
    }
  }

  async addNewCommunityDesign(
    circleId: string,
    asset: Express.Multer.File,
  ): Promise<AddedNFTTypeResponse> {
    try {
      const existinKudosDesigns = await this.getAllDesigns();
      if (existinKudosDesigns.length >= 45) {
        await this.removeFirstUserAddedKudosDesign();
      }

      let communityId, encodedString;
      const privateProps = await this.getPrivateProps(circleId);
      if (privateProps) {
        communityId = privateProps.mintkudosCommunityId;
        encodedString = Buffer.from(
          communityId + ':' + privateProps.mintkudosApiKey,
        ).toString('base64');
      } else {
        communityId = process.env.MINTKUDOS_DEFAULT_COMMUNITY_ID;
        encodedString = Buffer.from(
          communityId + ':' + process.env.MINTKUDOS_DEFAULT_API_KEY,
        ).toString('base64');
      }

      const nftTypeId = uuidv4();
      const ext = asset.originalname.split('.').pop();
      const formData = new FormData();
      formData.append('assetFile', Readable.from(asset.buffer), {
        filename: asset.originalname,
      });
      formData.append('name', `${uuidv4()}.${ext}`);
      formData.append('alias', `${asset.originalname}`);
      formData.append('nftTypeId', nftTypeId);
      const res = await await fetch(
        `${process.env.MINTKUDOS_URL}/v1/communities/${communityId}/nftTypes`,
        {
          method: 'POST',
          headers: {
            Authorization: `Basic ${encodedString}`,
          },
          body: formData,
        },
      );
      if (!res.ok) {
        const error = await res.json();
        console.log({ error });
        throw error;
      }
      const data = await res.json();

      if (!privateProps) {
        const circle = await this.queryBus.execute(
          new GetCircleByIdQuery(circleId),
        );

        await this.commandBus.execute(
          new UpdateCircleCommand(
            circleId,
            {
              nftTypeIds: [...(circle.nftTypeIds || []), nftTypeId],
            },
            '',
          ),
        );
      }
      return { ...data, nftTypeId, name: asset.originalname };
    } catch (e) {
      this.logger.error(
        `Failed adding new community design with error ${e.message}`,
      );
      console.log({ e });
      return e;
    }
  }

  async removeFirstUserAddedKudosDesign(): Promise<nftTypes> {
    try {
      const encodedString = Buffer.from(
        process.env.MINTKUDOS_DEFAULT_COMMUNITY_ID +
          ':' +
          process.env.MINTKUDOS_DEFAULT_API_KEY,
      ).toString('base64');
      const nftTypes = await this.getAllDesigns();
      const nftType = nftTypes.find((nftType) => nftType.isUserAdded);
      if (!nftType) {
        throw new Error('No user added kudos design found');
      }
      const res2 = await fetch(
        `${process.env.MINTKUDOS_URL}/v1/communities/${process.env.MINTKUDOS_DEFAULT_COMMUNITY_ID}/nftTypes/${nftType.nftTypeId}`,
        {
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: `Basic ${encodedString}`,
          },
          method: 'DELETE',
        },
      );
      if (!res2.ok) {
        const error = await res2.json();
        console.log({ error });
        throw error;
      }

      return nftType;
    } catch (e) {
      this.logger.error(
        `Failed removing first community design with error ${e.message}`,
      );
      console.log({ e });
      return e;
    }
  }

  async getKudosByAddress(
    address: string,
    offset?: number,
    limit?: number,
    tokenIds?: string[],
  ): Promise<KudosType[]> {
    let offsetLimit = '';
    if (offset) {
      offsetLimit = offsetLimit + `&offset=${offset}`;
    }
    if (limit) {
      offsetLimit = offsetLimit + `&limit=${limit}`;
    }
    const res = await fetch(
      `${process.env.MINTKUDOS_URL}/v1/wallets/${address}/tokens?claimStatus=claimed${offsetLimit}`,
      {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      },
    );
    const data = await res.json();
    let filteredData = data.data;
    if (tokenIds) {
      filteredData = filteredData.filter((kudos) =>
        tokenIds.includes(kudos.kudosTokenId.toString()),
      );
    }

    return filteredData;
  }

  async getSpaceKudos(spaceId: string) {
    const res = await this.commandBus.execute(
      new GetSpaceCollectionsCommand(spaceId),
    );
    const spaceKudos = [];
    for await (const collection of res as Collection[]) {
      if (collection.formMetadata?.mintkudosTokenId) {
        const kudo = await this.getKudosById(
          collection.formMetadata.mintkudosTokenId,
        );
        spaceKudos.push(kudo);
      }
    }

    return spaceKudos;
  }

  async getKudosById(id: number) {
    const kudo = await (
      await fetch(`${process.env.MINTKUDOS_URL}/v1/tokens/${id}`)
    ).json();
    return {
      id: kudo.tokenId.toString(),
      name: kudo.headline,
      description: kudo.description,
      imageUri: kudo.imageUrl,
      type: 'soulbound',
      service: 'kudos',
    };
  }

  mapToCredentials(kudos: KudosType[]): Credential[] {
    if (!kudos) {
      return [];
    }
    return kudos.map((k) => {
      return {
        id: k.kudosTokenId.toString(),
        name: k.headline,
        description: '',
        imageUri: k.assetUrl,
        type: 'soulbound',
        service: 'kudos',
      };
    });
  }
}
