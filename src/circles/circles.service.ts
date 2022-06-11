import {
  Injectable,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
} from '@nestjs/common';
import { ReturnModelType } from '@typegoose/typegoose';
import { CreateCircleRequestDto } from './dto/create-circle-request.dto';
import { Circle } from './model/circle.model';
import { CirclesRepository } from './circles.repository';
import { SlugService } from 'src/slug/slug.service';
@Injectable()
export class CirclesService {
  constructor(
    private readonly circlesRepository: CirclesRepository,
    private readonly slugService: SlugService,
  ) {}

  async create(createCircleDto: CreateCircleRequestDto): Promise<Circle> {
    try {
      const slug = await this.slugService.generateUniqueSlug(
        createCircleDto.name,
        this.circlesRepository,
      );
      console.log(slug);
      const createdCircle = await this.circlesRepository.create({
        ...createCircleDto,
        slug: slug,
      });

      return createdCircle;
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed circle creation',
        error.message,
      );
    }
  }

  async getDetailedCircle(id: string): Promise<Circle> {
    const circle = await this.circlesRepository.findById(id);
    return circle;
  }

  async getParentCircles(): Promise<Circle[]> {
    const circles = await this.circlesRepository.getParentCircles();
    return circles;
  }

  async deleteCircle(id: string): Promise<Circle> {
    const circle = await this.circlesRepository.findById(id);
    if (!circle) {
      throw new HttpException('Circle not found', HttpStatus.NOT_FOUND);
    }
    await this.circlesRepository.deleteById(id);
    return circle;
  }
}
