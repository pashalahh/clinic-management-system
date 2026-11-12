import { Test, TestingModule } from '@nestjs/testing';
import { DepartemenController } from './departemen.controller.js';
import { DepartemenService } from './departemen.service.js';

describe('DepartemenController', () => {
  let controller: DepartemenController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DepartemenController],
      providers: [DepartemenService],
    }).compile();

    controller = module.get<DepartemenController>(DepartemenController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
