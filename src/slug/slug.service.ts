import { Injectable } from '@nestjs/common';
import * as urlSlug from 'url-slug';
import { BaseRepository } from 'src/base/base.repository';
import { BaseModel } from 'src/base/base.model';

@Injectable()
export class SlugService {
  async generateUniqueSlug(
    generateFrom: string,
    repository: BaseRepository<any>,
  ) {
    const slug = urlSlug.convert(generateFrom, {
      separator: '-',
      transformer: urlSlug.LOWERCASE_TRANSFORMER,
    });
    const existingSlugCount = await repository.count({ slug }).exec();
    if (existingSlugCount > 0) {
      return `${slug}-${existingSlugCount}`;
    }
    return slug;
  }
}
