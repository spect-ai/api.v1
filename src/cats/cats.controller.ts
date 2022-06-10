import { Controller, Get, Post, Body } from '@nestjs/common';
import { CatsService } from './cats.service';
import { ApiTags } from '@nestjs/swagger';
import { CreateCatDto } from './dto/create-cat.dto';
import { Cat } from './model/cat.model';

@Controller('cats')
@ApiTags('Cats')
export class CatsController {
  constructor(private readonly catsService: CatsService) {}

  /**
   * Get all cats
   */
  @Get()
  async getCats(): Promise<Cat[] | null> {
    return await this.catsService.findAll();
  }

  /**
   * Create a cat
   */
  @Post()
  async create(@Body() cat: CreateCatDto): Promise<Cat> {
    return await this.catsService.create(cat);
  }
}
