import { Module } from '@nestjs/common';
import { DokterService } from './dokter.service.js';
import { DokterController } from './dokter.controller.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Dokter } from './entities/dokter.entity.js';
import { JanjiTemu } from '../janji-temu/entities/janji-temu.entity.js';
import { Departemen } from '../departemen/entities/departemen.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Dokter, Departemen, JanjiTemu])],
  controllers: [DokterController],
  providers: [DokterService],
})
export class DokterModule {}
