import {
  Body,
  Controller,
  Get,
  InternalServerErrorException,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { SessionAuthGuard } from 'src/auth/iron-session.guard';
import { ObjectIdDto } from 'src/common/dtos/object-id.dto';
import { LoggingService } from 'src/logging/logging.service';
import { CirclesPrivateRepository } from './circles-private.repository';
import {
  CreatePrivateCircleRequestDto,
  UpdatePrivateCircleRequestDto,
} from './dto/private-circle-request.dto';

import { CirclePrivate } from './model/circle-private.model';

@Controller('circle/private/v1')
export class CirclePrivateController {
  constructor(
    private readonly circlesPrivateRepository: CirclesPrivateRepository,
    private readonly logger: LoggingService,
  ) {
    this.logger.setContext('CirclePrivateController');
  }

  @Post('/')
  @UseGuards(SessionAuthGuard)
  async createPrivateCircleProperties(
    @Body() createPrivateCircleRequestDto: CreatePrivateCircleRequestDto,
  ): Promise<boolean> {
    try {
      await this.circlesPrivateRepository.create(createPrivateCircleRequestDto);
      return true;
    } catch (e) {
      // TODO: Distinguish between DocumentNotFound error and other errors correctly, silent errors are not good
      console.log(e);
      this.logger.error(`Failed updating mint kudos`);
      return false;
    }
  }

  // TODO: Fix guard so only relevant permission can get info
  @Get('/:id')
  @UseGuards(SessionAuthGuard)
  async getPrivateCircleProperties(
    @Param() param: ObjectIdDto,
  ): Promise<CirclePrivate> {
    try {
      return await this.circlesPrivateRepository.findOne({
        circleId: param.id,
      });
    } catch (e) {
      // TODO: Distinguish between DocumentNotFound error and other errors correctly, silent errors are not good
      this.logger.error(`Failed updating mint kudos`);
      throw new InternalServerErrorException(
        'Error while get private circle properties',
      );
    }
  }

  @Patch('/:id')
  @UseGuards(SessionAuthGuard)
  async updatePrivateCircleProperties(
    @Param() param: ObjectIdDto,
    @Body() updatePrivateCircleRequestDto: UpdatePrivateCircleRequestDto,
  ): Promise<boolean> {
    try {
      const res = await this.circlesPrivateRepository.findById(param.id);
      if (!res) {
        await this.circlesPrivateRepository.create({
          ...updatePrivateCircleRequestDto,
          circleId: param.id,
        });
      } else
        await this.circlesPrivateRepository.updateById(
          param.id,
          updatePrivateCircleRequestDto,
        );
      return true;
    } catch (e) {
      // TODO: Distinguish between DocumentNotFound error and other errors correctly, silent errors are not good
      console.log(e);
      this.logger.error(`Failed updating mint kudos`);
      return false;
    }
  }
}
