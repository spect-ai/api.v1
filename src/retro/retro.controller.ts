import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  SetMetadata,
  UseGuards,
} from '@nestjs/common';
import { SessionAuthGuard } from 'src/auth/iron-session.guard';
import { CreateNewRetroAuthGuard, RetroAuthGuard } from 'src/auth/retro.guard';
import { ObjectIdDto } from 'src/common/dtos/object-id.dto';
import { RequiredSlugDto } from 'src/common/dtos/string.dto';
import { AddFeedbackRequestDto } from './dto/add-feedback-request.dto';
import { CreateRetroRequestDto } from './dto/create-retro-request.dto';
import { DetailedRetroResponseDto } from './dto/detailed-retro-response.dto';
import { UpdateRetroRequestDto } from './dto/update-retro-request.dto';
import { UpdateVoteRequestDto } from './dto/update-retro-vote-request.dto';
import { RetroService } from './retro.service';

@Controller('retro')
export class RetroController {
  constructor(private readonly retroService: RetroService) {}

  @UseGuards(SessionAuthGuard)
  @Get('/slug/:slug')
  async findBySlug(
    @Param() param: RequiredSlugDto,
  ): Promise<DetailedRetroResponseDto> {
    return await this.retroService.getDetailedRetroBySlug(param.slug);
  }

  @UseGuards(SessionAuthGuard)
  @Get('/:id')
  async findByObjectId(
    @Param() param: ObjectIdDto,
  ): Promise<DetailedRetroResponseDto> {
    return await this.retroService.getDetailedRetro(param.id);
  }

  @UseGuards(CreateNewRetroAuthGuard)
  @Post('/')
  async create(
    @Body() createRetroRequestDto: CreateRetroRequestDto,
  ): Promise<DetailedRetroResponseDto> {
    return await this.retroService.create(createRetroRequestDto);
  }

  @SetMetadata('permissions', ['createNewRetro'])
  @UseGuards(RetroAuthGuard)
  @Patch('/:id')
  async update(
    @Param() param: ObjectIdDto,
    @Body() updateRetroRequestDto: UpdateRetroRequestDto,
  ): Promise<DetailedRetroResponseDto> {
    return await this.retroService.update(param.id, updateRetroRequestDto);
  }

  @UseGuards(SessionAuthGuard)
  @Patch('/:id/vote')
  async vote(
    @Param() param: ObjectIdDto,
    @Body() updateVotesRequestDto: UpdateVoteRequestDto,
  ): Promise<DetailedRetroResponseDto> {
    return await this.retroService.vote(param.id, updateVotesRequestDto);
  }

  @UseGuards(SessionAuthGuard)
  @Patch('/:id/giveFeedback')
  async giveFeedback(
    @Param() param: ObjectIdDto,
    @Body() addFeedbackRequestDto: AddFeedbackRequestDto,
  ): Promise<DetailedRetroResponseDto> {
    return await this.retroService.addFeedback(param.id, addFeedbackRequestDto);
  }

  @SetMetadata('permissions', ['endRetroManually'])
  @UseGuards(RetroAuthGuard)
  @Patch('/:id/endRetro')
  async endRetro(
    @Param() param: ObjectIdDto,
  ): Promise<DetailedRetroResponseDto> {
    return await this.retroService.endRetro(param.id);
  }

  @Post('/:id/delete')
  async delete(@Param('id') id): Promise<DetailedRetroResponseDto> {
    return await this.retroService.delete(id);
  }
}
