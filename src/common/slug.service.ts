import { Injectable } from '@nestjs/common';
import * as urlSlug from 'url-slug';

@Injectable()
export class SlugService {
  async generateUniqueSlug(generateFrom: string, repository: any) {
    const slug = urlSlug.convert(generateFrom, {
      separator: '-',
      transformer: urlSlug.LOWERCASE_TRANSFORMER,
    });
    const existingSlugCount = await repository
      .count({
        $or: [{ slug: slug }, { slug: new RegExp(slug + '-[0-9]+$') }],
      })
      .exec();
    if (existingSlugCount > 0) {
      return `${slug}-${existingSlugCount}`;
    }
    return slug;
  }
}
