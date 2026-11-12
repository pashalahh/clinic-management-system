import { Test, TestingModule } from '@nestjs/testing';
import { PasienService } from './pasien.service.js';

describe('PasienService', () => {
  let service: PasienService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PasienService],
    }).compile();

    service = module.get<PasienService>(PasienService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
