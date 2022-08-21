import {
  CreateWorkThreadRequestDto,
  CreateWorkUnitRequestDto,
} from 'src/card/dto/work-request.dto';

export class CreateWorkThreadCommand {
  constructor(
    public readonly id: string,
    public readonly createWorkThread: CreateWorkThreadRequestDto,
    public readonly caller: string,
  ) {}
}

export class CreateWorkUnitCommand {
  constructor(
    public readonly id: string,
    public readonly threadId: string,
    public readonly createWorkUnit: CreateWorkUnitRequestDto,
    public readonly caller: string,
  ) {}
}
