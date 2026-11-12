import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { RekamMedis } from './entities/rekam-medis.entity.js';
import { JanjiTemu } from '../janji-temu/entities/janji-temu.entity.js';
import { Repository } from 'typeorm';
import { DataSource } from 'typeorm';
import { CreateRekamMedisDto } from './dto/create-rekam-medi.dto.js';
import { StatusJanjiTemu } from '../janji-temu/enums/status-janji-temu.enum.js';
import { UpdateRekamMedisDto } from './dto/update-rekam-medis.dto.js';

@Injectable()
export class RekamMedisService {
  constructor(
    @InjectRepository(RekamMedis)
    private readonly rekamMedisRepository: Repository<RekamMedis>,
    @InjectRepository(JanjiTemu)
    private readonly janjiTemuRepository: Repository<JanjiTemu>,
    // DataSource dipakai untuk membuat transaksi database
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async create(dto: CreateRekamMedisDto): Promise<RekamMedis> {
    const janjiTemu = await this.janjiTemuRepository.findOneBy({ id: dto.janjiTemuId });
    if (!janjiTemu) {
      throw new NotFoundException(`Janji temu ${dto.janjiTemuId} tidak ditemukan`);
    }

    // Aturan bisnis 1: hanya janji yang sudah dikonfirmasi / selesai yang boleh dicatat
    const statusBolehDicatat = [StatusJanjiTemu.DIKONFIRMASI, StatusJanjiTemu.SELESAI];
    if (!statusBolehDicatat.includes(janjiTemu.status)) {
      throw new ConflictException(
        `Rekam medis hanya dapat dibuat untuk janji temu berstatus DIKONFIRMASI atau SELESAI (status saat ini: ${janjiTemu.status})`,
      );
    }

    // Aturan bisnis 2: satu janji temu hanya boleh punya satu rekam medis
    const sudahAda = await this.rekamMedisRepository.findOneBy({ janjiTemuId: dto.janjiTemuId });
    if (sudahAda) {
      throw new ConflictException('Janji temu ini sudah memiliki rekam medis');
    }

    // Aturan bisnis 3: simpan rekam medis + ubah status janji menjadi SELESAI
    // dalam SATU transaksi. Jika salah satu gagal, keduanya dibatalkan (rollback).
    const tersimpan = await this.dataSource.transaction(async (manager) => {
      const rekamBaru = manager.create(RekamMedis, dto);
      const hasil = await manager.save(rekamBaru);

      if (janjiTemu.status === StatusJanjiTemu.DIKONFIRMASI) {
        await manager.update(JanjiTemu, janjiTemu.id, { status: StatusJanjiTemu.SELESAI });
      }
      return hasil;
    });

    return await this.findOne(tersimpan.id);
  }

  async findAll(): Promise<RekamMedis[]> {
    return await this.rekamMedisRepository.find({
      relations: { janjiTemu: { pasien: true, dokter: true } },
      order: { dibuatPada: 'DESC' },
    });
  }

  async findOne(id: string): Promise<RekamMedis> {
    const rekamMedis = await this.rekamMedisRepository.findOne({
      where: { id },
      relations: { janjiTemu: { pasien: true, dokter: true } },
    });
    if (!rekamMedis) {
      throw new NotFoundException(`Rekam medis ${id} tidak ditemukan`);
    }
    return rekamMedis;
  }

  async update(id: string, dto: UpdateRekamMedisDto): Promise<RekamMedis> {
    const rekamMedis = await this.rekamMedisRepository.findOneBy({ id });
    if (!rekamMedis) {
      throw new NotFoundException(`Rekam medis ${id} tidak ditemukan`);
    }
    this.rekamMedisRepository.merge(rekamMedis, dto);
    await this.rekamMedisRepository.save(rekamMedis);
    return await this.findOne(id);
  }

  async remove(id: string): Promise<{ message: string; idTerhapus: string }> {
    const rekamMedis = await this.rekamMedisRepository.findOneBy({ id });
    if (!rekamMedis) {
      throw new NotFoundException(`Rekam medis ${id} tidak ditemukan`);
    }
    await this.rekamMedisRepository.delete(id);
    return { message: `Rekam medis ${id} berhasil dihapus`, idTerhapus: id };
  }
}
