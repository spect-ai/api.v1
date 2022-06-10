import { Injectable } from '@nestjs/common';
import { CreateCatDto } from './dto/create-cat.dto';
import { CatsRepository } from './cats.repository';
import { Cat } from './model/cat.model';

@Injectable()
export class CatsService {
  constructor(private readonly catRepository: CatsRepository) {}

  async create(cat: CreateCatDto): Promise<Cat> {
    return this.catRepository.create(cat);
  }

  async findAll(): Promise<Cat[] | null> {
    return this.catRepository.findAll();
  }
}
