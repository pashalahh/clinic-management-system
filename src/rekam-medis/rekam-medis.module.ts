import { Module } from '@nestjs/common';
import { RekamMedisService } from './rekam-medis.service.js';
import { RekamMedisController } from './rekam-medis.controller.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RekamMedis } from './entities/rekam-medis.entity.js';
import { JanjiTemu } from '../janji-temu/entities/janji-temu.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([RekamMedis, JanjiTemu])],
  controllers: [RekamMedisController],
  providers: [RekamMedisService],
})
export class RekamMedisModule {}
