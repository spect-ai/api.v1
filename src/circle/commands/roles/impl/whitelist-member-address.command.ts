import { Circle } from 'src/circle/model/circle.model';

export class WhitelistMemberAddressCommand {
  constructor(
    public readonly address: string,
    public readonly roles: string[],
    public readonly circle?: Circle,
    public readonly id?: string,
  ) {}
}
