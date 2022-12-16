import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class JoinCircleUsingInvitationRequestDto {
  /**
   * Invitation id if joinUsing is invitation
   */
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  invitationId?: string;
}

interface Guild {
  id: string;
  name: string;
  icon: string;
  owner: boolean;
  permissions: number;
  features: string[];
  permissions_new: string;
}
export class JoinMultipleCirclesUsingDiscordDto {
  @IsArray()
  @IsNotEmpty()
  guildData: Guild[];
}
