import { Test, TestingModule } from '@nestjs/testing';
import { RekamMedisService } from './rekam-medis.service.js';

describe('RekamMedisService', () => {
  let service: RekamMedisService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RekamMedisService],
    }).compile();

    service = module.get<RekamMedisService>(RekamMedisService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
