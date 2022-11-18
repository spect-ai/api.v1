import {
  Controller,
  Get,
  InternalServerErrorException,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CircleAuthGuard } from 'src/auth/circle.guard';
import { ObjectIdDto } from 'src/common/dtos/object-id.dto';
import { GuildxyzService } from 'src/common/guildxyz.service';
import { LoggingService } from 'src/logging/logging.service';
import { CirclesRepository } from './circles.repository';

@Controller('circle/external/v1')
@ApiTags('circle.external.v1')
export class CircleExternalController {
  constructor(
    private readonly logger: LoggingService,
    private readonly guildsService: GuildxyzService,
    private readonly circlesRepository: CirclesRepository,
  ) {
    this.logger.setContext('CircleExternalController');
  }

  @UseGuards(CircleAuthGuard)
  @Get('/:id/guild')
  async getPrivateCircleProperties(@Param() param: ObjectIdDto) {
    try {
      const circle = await this.circlesRepository.findById(param.id);
      if (circle && circle.guildxyzId)
        return await this.guildsService.getGuild(circle.guildxyzId);
      else
        throw new InternalServerErrorException('Guild isnt setup for circle');
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException(
        'Error while getting guild properties',
      );
    }
  }
}
