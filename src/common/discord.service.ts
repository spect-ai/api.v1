import { Injectable } from '@nestjs/common';
import * as urlSlug from 'url-slug';
import { BaseRepository } from 'src/base/base.repository';
import { BaseModel } from 'src/base/base.model';

// TODO
@Injectable()
export class DiscordService {
  async getDiscordRole(discordId: string): Promise<string> {
    return 'discord-role';
  }

  async getSpectRoleFromDiscordId(discordId: string): Promise<string> {
    return 'spect-role';
  }
}
