import { Test, TestingModule } from '@nestjs/testing';
import { RekamMedisController } from './rekam-medis.controller.js';
import { RekamMedisService } from './rekam-medis.service.js';

describe('RekamMedisController', () => {
  let controller: RekamMedisController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RekamMedisController],
      providers: [RekamMedisService],
    }).compile();

    controller = module.get<RekamMedisController>(RekamMedisController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
