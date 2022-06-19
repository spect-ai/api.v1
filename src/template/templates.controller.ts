import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ObjectId } from 'mongoose';
import { SessionAuthGuard } from 'src/auth/iron-session.guard';
import { CreateTemplateDto } from './dto/create-project-template-dto';
import { DetailedTemplateResponseDto } from './dto/detailed-template-response.dto';
import { TemplatesService } from './templates.service';

@Controller('template')
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Get('/allProjectTemplates/:circle')
  async getProjectTemplates(
    @Param('circle') circle: string,
  ): Promise<DetailedTemplateResponseDto[]> {
    if (!circle) {
      return;
    }
    return await this.templatesService.getTemplates('project', circle, null);
  }

  @Post('/')
  @UseGuards(SessionAuthGuard)
  async create(
    @Body() template: CreateTemplateDto,
  ): Promise<DetailedTemplateResponseDto> {
    return await this.templatesService.create(template);
  }
}
