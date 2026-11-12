import { Module } from '@nestjs/common';
import { DepartemenService } from './departemen.service.js';
import { DepartemenController } from './departemen.controller.js';
import { Dokter } from '../dokter/entities/dokter.entity.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Departemen } from './entities/departemen.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Departemen, Dokter])],
  controllers: [DepartemenController],
  providers: [DepartemenService],
})
export class DepartemenModule {}
