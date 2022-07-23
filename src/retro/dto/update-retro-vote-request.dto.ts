import { IsObject } from 'class-validator';

export class UpdateVoteRequestDto {
  /**
   * The member who's part of the retro period
   */
  @IsObject()
  votes: { [key: string]: number };
}
