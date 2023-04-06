import { SocialsDto } from 'src/collection/dto/socials.dto';
import { User } from 'src/users/model/users.model';

export class SaveDraftFromDiscordCommand {
  constructor(
    public readonly data: object,
    public readonly callerDiscordId: string,
    public readonly channelId: string,
  ) {}
}

export class SaveAndPostSocialsCommand {
  constructor(
    public readonly socialsDto: SocialsDto,
    public readonly channelId: string,
    public readonly caller: User,
  ) {}
}
