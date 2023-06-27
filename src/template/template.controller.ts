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
import { CommonTools } from 'src/common/common.service';
import {
  DuplicateFormCommand,
  DuplicateProjectCommand,
} from 'src/collection/commands';
import { GetCircleByIdQuery } from 'src/circle/queries/impl';

@Controller('templates/v1')
export class TemplateController {
  constructor(
    private readonly templateService: TemplateService,
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
    private readonly commonTools: CommonTools,
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
  ): Promise<{
    redirectUrl: string;
  }> {
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

    const idBeingDuplicated = template[templateUrl].split('/').pop();
    if (this.commonTools.isUUID(idBeingDuplicated)) {
      const collection = (await this.queryBus.execute(
        new GetCollectionBySlugQuery(idBeingDuplicated),
      )) as Collection;
      let res;
      if (collection.collectionType === 0)
        res = await this.commandBus.execute(
          new DuplicateFormCommand(
            idBeingDuplicated,
            req.user,
            destinationCircleId,
          ),
        );
      else
        res = await this.commandBus.execute(
          new DuplicateProjectCommand(
            idBeingDuplicated,
            req.user,
            destinationCircleId,
          ),
        );

      const circle = (await this.queryBus.execute(
        new GetCircleByIdQuery(res.circleId),
      )) as Circle;
      return {
        redirectUrl: `${circle.slug}/r/${res.slug}`,
      };
    } else {
      const res = await this.commandBus.execute(
        new DuplicateCircleCommand(
          idBeingDuplicated,
          req.user,
          true,
          false,
          true,
          destinationCircleId,
          useTemplateDto.useTemplateCircleSpecificInfoDtos,
          useTemplateDto.discordGuildId,
        ),
      );
      return {
        redirectUrl: `/${res.slug}`,
      };
    }
  }
}
