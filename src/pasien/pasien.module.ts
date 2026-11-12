import { Module } from '@nestjs/common';
import { PasienService } from './pasien.service.js';
import { PasienController } from './pasien.controller.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Pasien } from './entities/pasien.entity.js';
import { JanjiTemu } from '../janji-temu/entities/janji-temu.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Pasien, JanjiTemu])],
  controllers: [PasienController],
  providers: [PasienService],
})
export class PasienModule {}
