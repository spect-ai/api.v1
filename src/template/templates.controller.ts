import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ObjectId } from 'mongoose';
import { SessionAuthGuard } from 'src/auth/iron-session.guard';
import { CreateTemplateDto } from './dto/create-project-template-dto';
import { DetailedTemplateResponseDto } from './dto/detailed-template-response.dto';
import { GetProjectTemplatesDto } from './dto/get-project-templates.dto';
import { TemplatesService } from './templates.service';

@Controller('template')
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Get('/allProjectTemplates/:circle')
  async getProjectTemplates(
    @Param() param: GetProjectTemplatesDto,
  ): Promise<DetailedTemplateResponseDto[]> {
    return await this.templatesService.getTemplates(
      'project',
      param.circle,
      null,
    );
  }

  @Post('/')
  @UseGuards(SessionAuthGuard)
  async create(
    @Body() template: CreateTemplateDto,
  ): Promise<DetailedTemplateResponseDto> {
    return await this.templatesService.create(template);
  }
}
