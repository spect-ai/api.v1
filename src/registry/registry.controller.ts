import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AddNewNetworkDto } from './dto/add-new-network.dto';
import { AddNewTokenDto } from './dto/add-new-token.dto';
import { RegistryService } from './registry.service';

@Controller('registry')
@ApiTags('registry.v0')
export class RegistryController {
  constructor(private readonly registryService: RegistryService) {}

  @Get('/getGlobalRegistry')
  async getGlobalRegistry() {
    return await this.registryService.getRegistry();
  }

  @Post('/addNewNetwork')
  async addNewNetwork(@Body() card: AddNewNetworkDto) {
    return await this.registryService.addNetwork(card);
  }

  @Post('/addNewToken')
  async addNewToken(@Body() token: AddNewTokenDto) {
    return await this.registryService.addToken(token);
  }
}
