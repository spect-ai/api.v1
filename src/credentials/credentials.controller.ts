import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminAuthGuard } from 'src/auth/iron-session.guard';
import { CommonTools } from 'src/common/common.service';
import { ObjectIdDto } from 'src/common/dtos/object-id.dto';
import {
  OptionalArrayOfTags,
  OptionalLimitDto,
  OptionalOffsetDto,
  RequiredEthAddressDto,
  RequiredIssuerDto,
} from 'src/common/dtos/string.dto';
import { Credential } from 'src/users/types/types';
import { CredentialsService } from './credentials.service';
import { CreateCredentialRequestDto } from './dto/create-credential.dto';
import { Credentials } from './model/credentials.model';
import { GitcoinPassportService } from './services/gitcoin-passport.service';
import { MazuryService } from './services/mazury.service';

@Controller('credentials/v1')
export class CredentialsController {
  constructor(
    private readonly credentialService: CredentialsService,
    private readonly mazuryService: MazuryService,
    private readonly passportService: GitcoinPassportService,
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
    @Query() addressParam: RequiredEthAddressDto,
    @Query() issuerParam: RequiredIssuerDto,
    @Query() offsetParam: OptionalOffsetDto,
    @Query() limitParam: OptionalLimitDto,
  ): Promise<Credential[]> {
    return await this.credentialService.getByAddressAndIssuer(
      addressParam.ethAddress,
      issuerParam.issuer,
      offsetParam.offset,
      limitParam.limit,
    );
  }

  @Get('/allPassportsByAddress')
  async allPassportsByAddress(
    @Query() param: RequiredEthAddressDto,
  ): Promise<any> {
    return await this.passportService.getByEthAddress(param.ethAddress);
  }

  @Get('/:id')
  async getById(@Param() param: ObjectIdDto): Promise<Credentials> {
    return await this.credentialService.getById(param.id);
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
