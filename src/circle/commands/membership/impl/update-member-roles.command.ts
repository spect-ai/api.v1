import { UpdateMemberRolesDto } from 'src/circle/dto/update-member-role.dto';
import { Circle } from 'src/circle/model/circle.model';

export class UpdateMemberRolesCommand {
  constructor(
    public readonly updateMemberRolesDto: UpdateMemberRolesDto,
    public readonly userId: string,
    public readonly id?: string,
    public readonly circle?: Circle,
    public readonly skipMutabilityCheck?: boolean,
  ) {}
}
