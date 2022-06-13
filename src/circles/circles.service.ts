import {
  Injectable,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
} from '@nestjs/common';
import { ReturnModelType } from '@typegoose/typegoose';
import { CreateCircleRequestDto } from './dto/create-circle-request.dto';
import { DetailedCircleResponseDto } from './dto/detailed-circle-response.dto';
import { UpdateCircleRequestDto } from './dto/update-circle-request.dto';
import { Circle } from './model/circle.model';
import { CirclesRepository } from './circles.repository';
import { SlugService } from 'src/common/slug.service';
import { Ref } from '@typegoose/typegoose';
import { Types } from 'mongoose';
@Injectable()
export class CirclesService {
  constructor(
    private readonly circlesRepository: CirclesRepository,
    private readonly slugService: SlugService,
  ) {}

  async getDetailedCircle(id: string): Promise<DetailedCircleResponseDto> {
    const circle =
      await this.circlesRepository.getCircleWithPopulatedReferences(id);
    return circle;
  }

  async getPublicParentCircles(): Promise<Circle[]> {
    const circles = await this.circlesRepository.getPublicParentCircles();
    return circles;
  }

  async create(
    createCircleDto: CreateCircleRequestDto,
  ): Promise<DetailedCircleResponseDto> {
    try {
      const slug = await this.slugService.generateUniqueSlug(
        createCircleDto.name,
        this.circlesRepository,
      );

      let parentCircleRefArray = [] as Ref<Circle, Types.ObjectId>[];
      let parentCircleObj: Circle;
      if (createCircleDto.parent) {
        const parentRef = await this.circlesRepository.getCircleRef(
          createCircleDto.parent,
        );
        parentCircleObj = parentRef as Circle;
        parentCircleRefArray = [parentRef];
      }

      const createdCircle = await this.circlesRepository.create({
        ...createCircleDto,
        slug: slug,
        parents: parentCircleRefArray,
      });

      if (parentCircleObj) {
        await this.circlesRepository.updateById(parentCircleObj.id as string, {
          ...parentCircleObj,
          children: [...parentCircleObj.children, createdCircle],
        });
      }

      return createdCircle;
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed circle creation',
        error.message,
      );
    }
  }

  async update(
    id: string,
    updateCircleDto: UpdateCircleRequestDto,
  ): Promise<Circle> {
    try {
      const updatedCircle = await this.circlesRepository.updateById(
        id,
        updateCircleDto,
      );
      return updatedCircle;
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed circle update',
        error.message,
      );
    }
  }

  // async join(
  //   id: string,
  //   updateCircleDto: UpdateCircleRequestDto,
  // ): Promise<Circle> {
  //   const updatedCircle = await this.circlesRepository.updateById(
  //     id,
  //     updateCircleDto,
  //   );
  //   return updatedCircle;
  // }

  async delete(id: string): Promise<Circle> {
    const circle = await this.circlesRepository.findById(id);
    if (!circle) {
      throw new HttpException('Circle not found', HttpStatus.NOT_FOUND);
    }
    return await this.circlesRepository.deleteById(id);
  }
}
