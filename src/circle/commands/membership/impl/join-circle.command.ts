import { JoinCircleUsingInvitationRequestDto } from 'src/circle/dto/join-circle.dto';
import { User } from 'src/users/model/users.model';

export class JoinUsingInvitationCommand {
  constructor(
    public readonly id: string,
    public readonly joinCircleDto: JoinCircleUsingInvitationRequestDto,
    public readonly caller: User,
  ) {}
}

export class JoinUsingDiscordCommand {
  constructor(public readonly id: string, public readonly caller: User) {}
}

export class JoinUsingGuildxyzCommand {
  constructor(public readonly id: string, public readonly caller: User) {}
}

export class JoinMultipleCirclesUsingGuildCommand {
  constructor(
    public readonly ethAddress: string,
    public readonly caller: User,
  ) {}
}

export class JoinAsWhitelistedAddressCommand {
  constructor(public readonly id: string, public readonly caller: User) {}
}

export class JoinWithoutInvitationCommand {
  constructor(public readonly id: string, public readonly caller: User) {}
}
