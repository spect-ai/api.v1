import {
  UpdateWorkThreadRequestDto,
  UpdateWorkUnitRequestDto,
} from 'src/card/dto/work-request.dto';

export class UpdateWorkThreadCommand {
  constructor(
    public readonly id: string,
    public readonly threadId: string,
    public readonly updateWorkThread: UpdateWorkThreadRequestDto,
    public readonly caller: string,
  ) {}
}

export class UpdateWorkUnitCommand {
  constructor(
    public readonly id: string,
    public readonly threadId: string,
    public readonly workUnitId: string,
    public readonly updateWorkUnit: UpdateWorkUnitRequestDto,
    public readonly caller: string,
  ) {}
}
