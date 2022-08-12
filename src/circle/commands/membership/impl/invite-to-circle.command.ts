import { InviteDto } from 'src/circle/dto/invite.dto';
import { Circle } from 'src/circle/model/circle.model';
import { User } from 'src/users/model/users.model';

export class InviteToCircleCommand {
  constructor(
    public readonly newInvite: InviteDto,
    public readonly caller: User,
    public readonly id?: string,
    public readonly circle?: Circle,
  ) {}
}
