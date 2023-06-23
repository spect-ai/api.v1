import { Injectable } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Collection } from 'src/collection/model/collection.model';
import { GetCollectionBySlugQuery } from 'src/collection/queries';
import { Property } from 'src/collection/types/types';
import {
  Template,
  TemplateAutomation,
  TemplateMinimal,
  TemplateRequirement,
} from './types';
import { Circle } from 'src/circle/model/circle.model';
import { GetCircleBySlugQuery } from 'src/circle/queries/impl';

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

@Injectable()
export class TemplateService {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
  ) {}

  mapPropertyIdToTemplateProperty(properties: { [key: string]: Property }): {
    [key: string]: string;
  } {
    const mappedPropertyIds = {};
    for (const [propertyId, property] of Object.entries(properties)) {
      if (property.name === 'Status')
        mappedPropertyIds['statusId'] = property.id;
      else if (property.name === 'Image')
        mappedPropertyIds['imageId'] = property.id;
      else if (property.name === 'Url')
        mappedPropertyIds['urlId'] = property.id;
      else if (property.name === 'Tags')
        mappedPropertyIds['tagsId'] = property.id;
      else if (property.name === 'Short Description')
        mappedPropertyIds['shortDescriptionId'] = property.id;
    }
    return mappedPropertyIds;
  }

  async getAllTemplates(): Promise<{
    templateData: TemplateMinimal[];
    templatesByGroup: { [key: string]: string[] };
  }> {
    if (!process.env.TEMPLATE_COLLECTION_SLUG)
      throw 'Template database not found';
    const templates = (await this.queryBus.execute(
      new GetCollectionBySlugQuery(process.env.TEMPLATE_COLLECTION_SLUG),
    )) as Collection;
    const mappedPropertyIds = this.mapPropertyIdToTemplateProperty(
      templates.properties,
    );
    const templatesByGroup = {} as { [key: string]: string[] };
    for (const group of groups) {
      templatesByGroup[group] = [];
    }
    const templateData = [] as TemplateMinimal[];
    for (const td of Object.values(templates.data)) {
      const tags = td[mappedPropertyIds['tagsId']]
        ? td[mappedPropertyIds['tagsId']].map((tag: any) => tag.label)
        : [];
      for (const tag of tags) {
        if (templatesByGroup[tag]) templatesByGroup[tag].push(td['slug']);
      }

      if (td[mappedPropertyIds['statusId']].label === 'Draft') continue;
      templateData.push({
        id: td['slug'],
        name: td['Title'],
        shortDescription: td[mappedPropertyIds['shortDescriptionId']],
        image: td[mappedPropertyIds['imageId']],
        tags: tags,
      });
    }
    console.log({ templateData });
    for (const group of groups) {
      if (templatesByGroup[group]?.length === 0) delete templatesByGroup[group];
    }

    return {
      templateData,
      templatesByGroup,
    };
  }

  async getTemplate(templateId: string): Promise<Template> {
    if (!process.env.TEMPLATE_COLLECTION_SLUG)
      throw 'Template database not found';
    const templates = (await this.queryBus.execute(
      new GetCollectionBySlugQuery(process.env.TEMPLATE_COLLECTION_SLUG),
    )) as Collection;
    const template = Object.values(templates.data).find(
      (t) => t['slug'] === templateId,
    );
    if (!template) throw 'Template not found';

    const mappedPropertyIds = this.mapPropertyIdToTemplateProperty(
      templates.properties,
    );
    const automations = [] as TemplateAutomation[];
    const circleId = template[mappedPropertyIds['urlId']].split('/').pop();
    console.log({ circleId });
    const templateCircle = (await this.queryBus.execute(
      new GetCircleBySlugQuery(circleId),
    )) as Circle;
    for (const [automationId, automation] of Object.entries(
      templateCircle?.automations || {},
    )) {
      const requirementsSet = new Set() as Set<TemplateRequirement>;
      for (const action of automation.actions) {
        if (['giveDiscordRole', 'removeDiscordRole'].includes(action.type)) {
          requirementsSet.add('discordRole');
        } else if (
          [
            'createDiscordThread',
            'postOnDiscordThread',
            'postOnDiscord',
            'createDiscordChannel',
          ].includes(action.type)
        )
          requirementsSet.add('discordChannel');

        if (
          ['createDiscordThread', 'createDiscordChannel'].includes(action.type)
        ) {
          if (action.data?.rolesToAdd?.length) {
            requirementsSet.add('discordRole');
          }
        }
      }
      automations.push({
        id: automationId,
        name: automation.name,
        description: automation.description,
        requirements: [...requirementsSet],
      });
    }

    const tags = template[mappedPropertyIds['tagsId']]
      ? template[mappedPropertyIds['tagsId']].map((tag: any) => tag.label)
      : [];
    return {
      id: template[mappedPropertyIds['slug']],
      name: template['Title'],
      description: template['Description'],
      shortDescription: template[mappedPropertyIds['shortDescriptionId']],
      image: template[mappedPropertyIds['imageId']],
      url: template[mappedPropertyIds['urlId']],
      automations,
      tags,
    };
  }
}
