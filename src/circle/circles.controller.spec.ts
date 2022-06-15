import { Test, TestingModule } from '@nestjs/testing';
import { CirclesController } from './circles.controller';

describe('CirclesController', () => {
  let controller: CirclesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CirclesController],
    }).compile();

    controller = module.get<CirclesController>(CirclesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
