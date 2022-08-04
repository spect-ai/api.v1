import { Circle } from 'src/circle/model/circle.model';

export class DeleteCircleByIdCommand {
  constructor(public readonly id?: string, public readonly circle?: Circle) {}
}
