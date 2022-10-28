import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AdminAuthGuard } from 'src/auth/iron-session.guard';
import { ObjectIdDto } from 'src/common/dtos/object-id.dto';
import { CredentialsService } from './credentials.service';
import { CreateCredentialRequestDto } from './dto/create-credential.dto';
import { Credentials } from './model/credentials.model';

@Controller('credentials/v1')
export class CredentialsController {
  constructor(private readonly credentialService: CredentialsService) {}

  @Get('/')
  async getAll() {
    return await this.credentialService.getAll();
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
}
