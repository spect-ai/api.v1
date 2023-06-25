/* eslint-disable prettier/prettier */
import { UseTemplateCircleSpecificInfoDto } from 'src/template/dto/useTemplateCircleSpecificInfoDto.dto';
import { User } from 'src/users/model/users.model';

export class DuplicateCircleCommand {
  constructor(
    public readonly circleSlug: string,
    public readonly caller: User,
    public readonly duplicateCollections: boolean = true,
    public readonly duplicateMembership: boolean = true,
    public readonly duplicateAutomations: boolean = true,
    public readonly destinationCircleId?: string,
    public readonly useTemplateCircleSpecificInfoDto?: UseTemplateCircleSpecificInfoDto[],
    public readonly addDiscordGuildFromParent?: boolean,
  ) {}
}
