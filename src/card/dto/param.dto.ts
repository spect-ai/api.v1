import { PartialType } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { IsObjectId } from 'class-validator-mongo-object-id';

export class UpdateWorkThreadParamDto {
  /**
   * Card Object Id
   */
  @IsObjectId({
    message: 'Invalid object id',
  })
  @IsNotEmpty()
  id: string;

  /**
   * Thread Id
   */
  @IsString()
  @IsNotEmpty()
  threadId: string;
}

export class CreateWorkUnitParamDto extends PartialType(
  UpdateWorkThreadParamDto,
) {}

export class UpdateWorkUnitParamDto extends PartialType(
  UpdateWorkThreadParamDto,
) {
  /**
   * Work unit Id
   */
  @IsString()
  @IsNotEmpty()
  workUnitId: string;
}
