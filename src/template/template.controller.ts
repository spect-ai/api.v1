import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { SessionAuthGuard } from 'src/auth/iron-session.guard';
import { DuplicateCircleCommand } from 'src/circle/commands/impl';
import { Circle } from 'src/circle/model/circle.model';
import { Collection } from 'src/collection/model/collection.model';
import { GetCollectionBySlugQuery } from 'src/collection/queries';
import { RequiredSlugDto } from 'src/common/dtos/string.dto';
import { UseTemplateCircleSpecificInfoDtos } from './dto/useTemplateCircleSpecificInfoDto.dto';
import { TemplateService } from './template.service';
import { Template } from './types';

@Controller('templates/v1')
export class TemplateController {
  constructor(
    private readonly templateService: TemplateService,
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
  ) {}

  @Get('/')
  async getAllTemplates() {
    return await this.templateService.getAllTemplates();
  }

  @Get('/:slug')
  async getTemplate(@Param() param: RequiredSlugDto): Promise<Template> {
    return await this.templateService.getTemplate(param.slug);
  }

  @UseGuards(SessionAuthGuard)
  @Post('/:slug/use')
  async duplicate(
    @Param() param: RequiredSlugDto,
    @Req() req: any,
    @Query('destinationCircleId') destinationCircleId?: string,
    @Body()
    useTemplateDto?: UseTemplateCircleSpecificInfoDtos,
  ): Promise<Circle> {
    console.log('duplicate');
    if (!process.env.TEMPLATE_COLLECTION_SLUG)
      throw 'Template database not found';
    const templates = (await this.queryBus.execute(
      new GetCollectionBySlugQuery(process.env.TEMPLATE_COLLECTION_SLUG),
    )) as Collection;
    const template = Object.values(templates.data).find(
      (t) => t['slug'] === param.slug,
    );
    if (!template) throw 'Template not found';

    let templateUrl = '';
    for (const [propertyId, property] of Object.entries(templates.properties)) {
      if (property.name === 'Url') {
        templateUrl = property.id;
        break;
      }
    }
    if (!templateUrl) throw 'Template Url not found';

    const circleIdBeingDuplicated = template[templateUrl].split('/').pop();
    return await this.commandBus.execute(
      new DuplicateCircleCommand(
        circleIdBeingDuplicated,
        req.user,
        true,
        true,
        true,
        destinationCircleId,
        useTemplateDto.useTemplateCircleSpecificInfoDtos,
        true,
      ),
    );
  }
}
