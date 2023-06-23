export type TemplateRequirement = 'discordRole' | 'discordChannel';

export type TemplateAutomation = {
  id: string;
  name: string;
  description: string;
  requirements: TemplateRequirement[];
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
