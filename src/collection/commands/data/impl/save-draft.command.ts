import { FormPaymentDto } from 'src/collection/dto/form-payment.dto';
import { SocialsDto } from 'src/collection/dto/socials.dto';
import { User } from 'src/users/model/users.model';

export class SaveDraftFromDiscordCommand {
  constructor(
    public readonly data: object,
    public readonly callerDiscordId: string,
    public readonly channelId: string,
    public readonly skip?: { [key: string]: boolean },
  ) {}
}

export class SaveAndPostSocialsCommand {
  constructor(
    public readonly socialsDto: SocialsDto,
    public readonly channelId: string,
    public readonly caller: User,
  ) {}
}

export class SaveAndPostPaymentCommand {
  constructor(
    public readonly formPaymentDto: FormPaymentDto,
    public readonly channelId: string,
    public readonly discordUserId: string,
    public readonly caller: User,
  ) {}
}
