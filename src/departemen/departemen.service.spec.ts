import { Test, TestingModule } from '@nestjs/testing';
import { DepartemenService } from './departemen.service.js';

describe('DepartemenService', () => {
  let service: DepartemenService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DepartemenService],
    }).compile();

    service = module.get<DepartemenService>(DepartemenService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
