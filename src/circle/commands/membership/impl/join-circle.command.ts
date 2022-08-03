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
