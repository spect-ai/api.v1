import { Test, TestingModule } from '@nestjs/testing';
import { EthAddressService } from './_eth-address.service';

describe('EthAddressService', () => {
  let service: EthAddressService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EthAddressService],
    }).compile();

    service = module.get<EthAddressService>(EthAddressService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
