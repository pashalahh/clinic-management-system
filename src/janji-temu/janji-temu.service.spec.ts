import { Test, TestingModule } from '@nestjs/testing';
import { JanjiTemuService } from './janji-temu.service.js';

describe('JanjiTemuService', () => {
  let service: JanjiTemuService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [JanjiTemuService],
    }).compile();

    service = module.get<JanjiTemuService>(JanjiTemuService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
