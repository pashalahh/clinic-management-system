import { Test, TestingModule } from '@nestjs/testing';
import { JanjiTemuController } from './janji-temu.controller.js';
import { JanjiTemuService } from './janji-temu.service.js';

describe('JanjiTemuController', () => {
  let controller: JanjiTemuController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [JanjiTemuController],
      providers: [JanjiTemuService],
    }).compile();

    controller = module.get<JanjiTemuController>(JanjiTemuController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
