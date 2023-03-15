import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  AdminAuthGuard,
  PublicViewAuthGuard,
} from 'src/auth/iron-session.guard';
import { AuthTokenRefreshService } from 'src/common/authTokenRefresh.service';
import { ObjectIdDto } from 'src/common/dtos/object-id.dto';
import {
  OptionalArrayOfTags,
  OptionalLimitDto,
  OptionalOffsetDto,
  RequiredClaimCodeDto,
  RequiredEthAddressDto,
  RequiredIssuerDto,
  RequiredPoapIdDto,
} from 'src/common/dtos/string.dto';
import { Credential } from 'src/users/types/types';
import { CredentialsService } from './credentials.service';
import { CreateCredentialRequestDto } from './dto/create-credential.dto';
import { PoapClaimDto } from './dto/mint-kudos.dto';
import { Credentials } from './model/credentials.model';
import { GitcoinPassportService } from './services/gitcoin-passport.service';
import { MazuryService } from './services/mazury.service';
import { PoapService } from './services/poap.service';

@Controller('credentials/v1')
@ApiTags('credentials.v1')
export class CredentialsController {
  constructor(
    private readonly credentialService: CredentialsService,
    private readonly mazuryService: MazuryService,
    private readonly passportService: GitcoinPassportService,
    private readonly poapService: PoapService,
    private readonly gitcoinPassportService: GitcoinPassportService,
  ) {}

  @Get('/')
  async getAll() {
    return await this.credentialService.getAll();
  }

  @Get('/findAnyoneByTags')
  async findAnyoneByTags(
    @Query() param: OptionalArrayOfTags,
  ): Promise<Credentials> {
    return await this.mazuryService.getBySearchTerm(param.term);
  }

  @Get('/allCredentialsByAddress')
  async allCredentialsByAddress(
    @Query() param: RequiredEthAddressDto,
  ): Promise<{ [key: string]: Credential[] }> {
    return await this.credentialService.getAllByAddress(param.ethAddress);
  }
  @Get('/credentialsByAddressAndIssuer')
  async credentialsByAddressAndIssuer(
    @Query() param: RequiredEthAddressDto,
    @Query() issuerParam: RequiredIssuerDto,
  ): Promise<Credential[]> {
    return await this.credentialService.getByAddressAndIssuer(
      param.ethAddress,
      issuerParam.issuer,
      param.offset,
      param.limit,
    );
  }

  @Get('/allPassportsByAddress')
  async allPassportsByAddress(
    @Query() param: RequiredEthAddressDto,
  ): Promise<any> {
    return await this.passportService.getByEthAddress(param.ethAddress);
  }

  @UseGuards(PublicViewAuthGuard)
  @Get('/poap/:poapId')
  async getPoapById(
    @Param() param: RequiredPoapIdDto,
    @Request() req,
  ): Promise<Credentials> {
    return await this.poapService.getPoapById(
      param.poapId,
      req.user?.ethAddress,
    );
  }

  @Post('/claimPoap')
  async claimPoap(@Body() body: PoapClaimDto): Promise<boolean> {
    return await this.poapService.claimPoap(
      body.claimCode,
      body.editCode,
      body.ethAddress,
    );
  }

  @Get('/:id')
  async getById(@Param() param: ObjectIdDto): Promise<Credentials> {
    return await this.credentialService.getById(param.id);
  }

  // Post request so that scores can be passed in as object
  @Post('/:ethAddress/passportScoreAndStamps')
  async getGtcPassportScoresAndStamps(
    @Param() param: RequiredEthAddressDto,
    @Body() body,
  ): Promise<{
    score: number;
    mappedStampsWithCredentials: any;
  }> {
    return await this.gitcoinPassportService.getPassportStampsAndScore(
      param.ethAddress,
      body.scores,
    );
  }

  @UseGuards(AdminAuthGuard)
  @Post('/')
  async create(
    @Body() circle: CreateCredentialRequestDto,
  ): Promise<Credentials> {
    return await this.credentialService.create(circle);
  }

  @UseGuards(AdminAuthGuard)
  @Post('/addAllCredentials')
  async addAllCredentials(): Promise<boolean> {
    return await this.credentialService.addAllCredentials();
  }
}
