import { Injectable } from '@nestjs/common';
import * as urlSlug from 'url-slug';
import { BaseRepository } from 'src/base/base.repository';
import { BaseModel } from 'src/base/base.model';
import { Project } from 'src/project/model/project.model';
import { Circle } from 'src/circle/model/circle.model';

@Injectable()
export class SlugService {
  async generateUniqueSlug(
    generateFrom: string,
    repository: BaseRepository<Project | Circle>,
  ) {
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
