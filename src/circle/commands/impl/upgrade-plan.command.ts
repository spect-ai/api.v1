import { UpgradePlanDto } from 'src/circle/dto/update-circle-request.dto';
import { User } from 'src/users/model/users.model';

export class UpgradePlanCommand {
  constructor(
    public readonly upgradePlanDto: UpgradePlanDto,
    public readonly id: string,
    public readonly caller: User,
  ) {}
}
