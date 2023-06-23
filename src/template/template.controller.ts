import {
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  GetCollectionByIdQuery,
  GetCollectionBySlugQuery,
} from 'src/collection/queries';
import { Template } from './types';
import { Collection } from 'src/collection/model/collection.model';
import { SessionAuthGuard } from 'src/auth/iron-session.guard';
import { RequiredSlugDto } from 'src/common/dtos/string.dto';
import { DuplicateCircleCommand } from 'src/circle/commands/impl';
import { Circle } from 'src/circle/model/circle.model';
import { TemplateService } from './template.service';

const statusId = '431af81f-75ab-4a34-8656-e885b47b4e0c';
const imageId = 'ff681f83-f903-49bc-87e6-c4c375cfff31';
const urlId = 'b05d3001-fd4e-440b-9f68-cb896b24bd98';
const tagsId = 'c2204f25-a77b-44a5-beaf-4760909f66bb';
const shortDescriptionId = 'de88db03-6884-4ecb-a5d5-9e19968ea1d8';

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
        false,
        destinationCircleId,
      ),
    );
  }
}
