export type TemplateAction = {
  name: string;
  description?: string;
  requirements: TemplateRequirement[];
};

export type TemplateRequirement =
  | 'discordRole'
  | 'discordChannel'
  | 'discordCategory';

export type TemplateAutomation = {
  id: string;
  name: string;
  description: string;
  actions: TemplateAction[];
};

export interface Template extends TemplateMinimal {
  url: string;
  description: string;
  automations: TemplateAutomation[];
}

export interface TemplateMinimal {
  id: string;
  name: string;
  shortDescription: string;
  image: string;
  tags: string[];
}
