import { Test, TestingModule } from '@nestjs/testing';
import { DokterService } from './dokter.service.js';

describe('DokterService', () => {
  let service: DokterService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DokterService],
    }).compile();

    service = module.get<DokterService>(DokterService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
