import { Test, TestingModule } from '@nestjs/testing';
import { RetroService } from './retro.service';

describe('RetroService', () => {
  let service: RetroService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RetroService],
    }).compile();

    service = module.get<RetroService>(RetroService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
