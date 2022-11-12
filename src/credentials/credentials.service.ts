import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { FilterQuery } from 'mongoose';
import { CredentialsRepository } from './credentials.repository';
import { CreateCredentialRequestDto } from './dto/create-credential.dto';
import { Credentials } from './model/credentials.model';
import { CommonTools } from 'src/common/common.service';
import { PLATFORMS } from 'src/config/platforms';
import { STAMP_PROVIDERS } from 'src/config/providers';
// import { PassportScorer} from '@gitcoinco/passport-sdk-scorer';
import { PassportReader } from '@gitcoinco/passport-sdk-reader';
import { GitcoinPassportService } from './services/gitcoin-passport.service';
import { MazuryService } from './services/mazury.service';
import { Credential, VerifiableCredential } from 'src/users/types/types';
import { KudosType, MazuryCredentialType } from './types/types';
import { MintKudosService } from './services/mintkudos.service';

@Injectable()
export class CredentialsService {
  constructor(
    private readonly credentialRepository: CredentialsRepository,
    private readonly gitcoinService: GitcoinPassportService,
    private readonly mazuryService: MazuryService,
    private readonly kudosService: MintKudosService,
  ) {}

  async getAll(): Promise<Credentials[]> {
    return await this.credentialRepository.findAll();
  }

  async getById(id: string): Promise<Credentials> {
    return await this.credentialRepository.findById(id);
  }
  async create(
    createCredentialDto: CreateCredentialRequestDto,
  ): Promise<Credentials> {
    try {
      return await this.credentialRepository.create(createCredentialDto);
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed credential creation',
        error.message,
      );
    }
  }

  async addAllCredentials(): Promise<boolean> {
    for (const platform of PLATFORMS) {
      if (!STAMP_PROVIDERS[platform.platform]) continue;
      for (const platformGroup of STAMP_PROVIDERS[platform.platform]) {
        for (const provider of platformGroup.providers) {
          const credential = await this.credentialRepository.findOne({
            provider: provider.name,
          } as FilterQuery<Credentials>);
          if (!credential) {
            const createCredentialDto = {
              provider: provider.name,
              providerName: platform.platform,
              providerImage: platform.icon,
              providerUrl: platform.url,
              issuer:
                'did:key:z6MkghvGHLobLEdj1bgRLhS4LPGJAvbMA1tn2zcRyqmYU5LC',
              issuerName: 'Gitcoin Passport',
              defaultScore: provider.defaultScore,
              stampDescription: provider.description,
              stampName: provider.title,
            } as CreateCredentialRequestDto;
            await this.create(createCredentialDto);
          }
        }
      }
    }
    return true;
  }

  async getAllByAddress(
    address: string,
  ): Promise<{ [key: string]: Credential[] }> {
    const res = {};
    const promises = [];
    res['gitcoinPassport'] = promises.push(
      this.gitcoinService.getByEthAddress(address),
    );
    const issuers = ['kudos', 'poap', 'gitpoap', 'sismo', 'buildspace'];
    for (const issuer of issuers) {
      promises.push(this.mazuryService.getCredentials(address, issuer));
    }
    [
      res['gitcoinPassport'],
      res['kudos'],
      res['poap'],
      res['gitpoap'],
      res['sismo'],
      res['buildspace'],
    ] = await Promise.all(promises);

    const mappingPromises = [];
    for (const issuer of issuers) {
      mappingPromises.push(
        this.mazuryService.mapToCredentials(res[issuer].results),
      );
    }
    [
      res['kudos'],
      res['poap'],
      res['gitpoap'],
      res['sismo'],
      res['buildspace'],
    ] = await Promise.all(mappingPromises);

    return res;
  }

  async getByAddressAndIssuer(
    address: string,
    issuer: string,
    offset?: number,
    limit?: number,
  ): Promise<Credential[]> {
    if (issuer === 'gitcoinPassport') {
      return await this.gitcoinService.getByEthAddress(address);
    } else if (issuer === 'kudos') {
      const credentials = await this.kudosService.getKudosByAddress(
        address,
        offset,
        limit,
      );
      return this.kudosService.mapToCredentials(credentials);
    } else {
      const credentials = await this.mazuryService.getCredentials(
        address,
        issuer,
        offset,
        limit,
      );
      return await this.mazuryService.mapToCredentials(credentials.results);
    }
  }
}
