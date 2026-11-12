import { Module } from '@nestjs/common';
import { JanjiTemuService } from './janji-temu.service.js';
import { JanjiTemuController } from './janji-temu.controller.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JanjiTemu } from './entities/janji-temu.entity.js';
import { Pasien } from '../pasien/entities/pasien.entity.js';
import { Dokter } from '../dokter/entities/dokter.entity.js';
import { RekamMedis } from '../rekam-medis/entities/rekam-medis.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([JanjiTemu, Pasien, Dokter, RekamMedis])],
  controllers: [JanjiTemuController],
  providers: [JanjiTemuService],
})
export class JanjiTemuModule {}
