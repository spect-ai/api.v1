import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class JoinCircleRequestDto {
  /**
   * Joining circle using invitation code or discord roles
   */
  @IsString()
  @IsNotEmpty()
  joinUsing: 'discord' | 'invitation';

  /**
   * Invitation id if joinUsing is invitation
   */
  @IsString()
  @IsOptional()
  invitationId?: string;
}
