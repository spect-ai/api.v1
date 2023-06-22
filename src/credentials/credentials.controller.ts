import {
  Body,
  Controller,
  Get,
  Param,
  Post,
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
import { CreateCredentialRequestDto } from './dto/create-credential.dto';
import { Credentials } from './model/credentials.model';
import { PoapService } from './services/poap.service';

@Controller('credentials/v1')
@ApiTags('credentials.v1')
export class CredentialsController {
  constructor(
    private readonly credentialService: CredentialsService,
    private readonly poapService: PoapService,
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
}
