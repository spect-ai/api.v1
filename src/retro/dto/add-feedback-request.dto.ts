import { IsObject } from 'class-validator';

export class AddFeedbackRequestDto {
  /**
   * The member who's part of the retro period
   */
  @IsObject()
  feedback: { [member: string]: string };
}
