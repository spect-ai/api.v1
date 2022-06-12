import { Test, TestingModule } from '@nestjs/testing';
import { RetroController } from './retro.controller';

describe('RetroController', () => {
  let controller: RetroController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RetroController],
    }).compile();

    controller = module.get<RetroController>(RetroController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
