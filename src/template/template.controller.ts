import { Controller, Get } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import {
  GetCollectionByIdQuery,
  GetCollectionBySlugQuery,
} from 'src/collection/queries';

const groups = [
  'Popular',
  'New',
  'Onboarding',
  'Education',
  'Community Management',
  'Governance',
  'Project Management',
  'Grant Program',
  'Event Management',
  'Social',
  'Marketing',
];

const statusId = '431af81f-75ab-4a34-8656-e885b47b4e0c';
const imageId = 'ff681f83-f903-49bc-87e6-c4c375cfff31';
const urlId = 'b05d3001-fd4e-440b-9f68-cb896b24bd98';
const tagsId = 'c2204f25-a77b-44a5-beaf-4760909f66bb';
const shortDescriptionId = 'de88db03-6884-4ecb-a5d5-9e19968ea1d8';

@Controller('templates/v1')
export class TemplateController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get('/')
  async getAllTemplates() {
    const templates = await this.queryBus.execute(
      new GetCollectionBySlugQuery('342d80ac-524d-489e-bc75-eebc6170e19e'),
    );
    const templatesByGroup = {};
    for (const group of groups) {
      templatesByGroup[group] = [];
    }
    const templateData = [];
    for (const td of Object.values(templates.data)) {
      const tags = td[tagsId] ? td[tagsId].map((tag: any) => tag.label) : [];
      for (const tag of tags) {
        if (templatesByGroup[tag]) templatesByGroup[tag].push(td['slug']);
      }

      if (td[statusId].label === 'Draft') continue;
      templateData.push({
        id: td['slug'],
        name: td['Title'],
        shortDescription: td[shortDescriptionId],
        description: td['Description'],
        image: td[imageId],
        url: td[urlId],
        tags: tags,
      });
    }

    return {
      templateData,
      templatesByGroup,
    };
  }
}
