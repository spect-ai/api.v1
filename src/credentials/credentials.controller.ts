import {
  Controller,
  Get,
  Param,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  AdminAuthGuard,
  PublicViewAuthGuard,
} from 'src/auth/iron-session.guard';
import { ObjectIdDto } from 'src/common/dtos/object-id.dto';
import { RequiredPoapIdDto } from 'src/common/dtos/string.dto';
import { CredentialsService } from './credentials.service';
import { Credentials } from './model/credentials.model';
import { ENSService } from './services/ens.service';
import { PoapService } from './services/poap.service';

@Controller('credentials/v1')
@ApiTags('credentials.v1')
export class CredentialsController {
  constructor(
    private readonly credentialService: CredentialsService,
    private readonly poapService: PoapService,
    private readonly ensService: ENSService,
  ) {}

  @Get('/')
  async getAll() {
    return await this.credentialService.getAll();
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

  @Get('/:id')
  async getById(@Param() param: ObjectIdDto): Promise<Credentials> {
    return await this.credentialService.getById(param.id);
  }

  @UseGuards(AdminAuthGuard)
  @Get('/ensName')
  async getEnsName(@Query('address') address) {
    return await this.ensService.resolveENSName(address);
  }

  @UseGuards(AdminAuthGuard)
  @Get('/addressFromEns')
  async getAddressFromEns(@Query('ens') ens) {
    return await this.ensService.resolveAddress(ens);
  }
}
