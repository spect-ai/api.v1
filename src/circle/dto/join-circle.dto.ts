import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class JoinCircleUsingInvitationRequestDto {
  /**
   * Invitation id if joinUsing is invitation
   */
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  invitationId?: string;
}
