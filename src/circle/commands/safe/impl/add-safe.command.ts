import { SafeAddress } from 'src/circle/dto/safe-request.dto';
import { Circle } from 'src/circle/model/circle.model';

export class AddSafeCommand {
  constructor(
    public readonly safeDto: SafeAddress,
    public readonly circle?: Circle,
    public readonly id?: string,
  ) {}
}
