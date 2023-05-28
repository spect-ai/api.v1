import { ApiHideProperty } from '@nestjs/swagger';
import { Property } from 'src/collection/types/types';
import { MappedItem } from 'src/common/interfaces';

export class CollectionDataResponseDto {
  name: string;
  slug: string;
  description: string;
  @ApiHideProperty()
  properties: MappedItem<Property>;
  @ApiHideProperty()
  data: MappedItem<object>;
}
