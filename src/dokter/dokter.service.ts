import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateDokterDto } from './dto/create-dokter.dto.js';
import { UpdateDokterDto } from './dto/update-dokter.dto.js';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Dokter } from './entities/dokter.entity.js';
import { JanjiTemu } from '../janji-temu/entities/janji-temu.entity.js';
import { Departemen } from '../departemen/entities/departemen.entity.js';


@Injectable()
export class DokterService {
  constructor(
    @InjectRepository(Dokter)
    private readonly dokterRepository: Repository<Dokter>,
    @InjectRepository(Departemen)
    private readonly departemenRepository: Repository<Departemen>,
    @InjectRepository(JanjiTemu)
    private readonly janjiTemuRepository: Repository<JanjiTemu>,
) {}

  // Nomor STR dan email harus unik
  private async cekUnik(nomorStr?: string, email?: string, idSendiri?: string): Promise<void> {
    if (nomorStr) {
      const ada = await this.dokterRepository.findOneBy({ nomorStr });
      if (ada && ada.id !== idSendiri) {
        throw new ConflictException(`Nomor STR ${nomorStr} sudah terdaftar`);
      }
    }
    if (email) {
      const ada = await this.dokterRepository.findOneBy({ email });
      if (ada && ada.id !== idSendiri) {
        throw new ConflictException(`Email ${email} sudah terdaftar`);
      }
    }
  }

  private async cekDepartemen(departemenId: string): Promise<void> {
    const departemen = await this.departemenRepository.findOneBy({ id: departemenId });
    if (!departemen) {
      throw new NotFoundException(`Departemen ${departemenId} tidak ditemukan`);
    }
  }

  async create(dto: CreateDokterDto): Promise<Dokter> {
    await this.cekDepartemen(dto.departemenId);
    await this.cekUnik(dto.nomorStr, dto.email);

    const dokterBaru = this.dokterRepository.create(dto);
    const tersimpan = await this.dokterRepository.save(dokterBaru);
    return await this.findOne(tersimpan.id);
  }

  async findAll(): Promise<Dokter[]> {
    return await this.dokterRepository.find({
      relations: { departemen: true },
      order: { namaLengkap: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Dokter> {
    const dokter = await this.dokterRepository.findOne({
      where: { id },
      relations: { departemen: true },
    });
    if (!dokter) {
      throw new NotFoundException(`Dokter ${id} tidak ditemukan`);
    }
    return dokter;
  }

  // Daftar janji temu milik seorang dokter
  async findJanjiTemu(id: string): Promise<JanjiTemu[]> {
      await this.findOne(id);
      return await this.janjiTemuRepository.find({
        where: { dokterId: id },
        relations: { pasien: true },
        order: { jadwal: 'DESC' },
      });
  }

  async update(id: string, dto: UpdateDokterDto): Promise<Dokter> {
    // Ambil tanpa relasi agar departemenId baru tidak tertimpa objek relasi lama
    const dokter = await this.dokterRepository.findOneBy({ id });
    if (!dokter) {
      throw new NotFoundException(`Dokter ${id} tidak ditemukan`);
    }

    if (dto.departemenId) {
      await this.cekDepartemen(dto.departemenId);
    }
    await this.cekUnik(dto.nomorStr, dto.email, id);

    this.dokterRepository.merge(dokter, dto);
    await this.dokterRepository.save(dokter);
    return await this.findOne(id);
  }

  async remove(id: string): Promise<{ message: string; idTerhapus: string }> {
    await this.findOne(id);

    // Konflik relasi: dokter masih punya janji temu
    const jumlahJanji = await this.janjiTemuRepository.countBy({ dokterId: id });
    if (jumlahJanji > 0) {
      throw new ConflictException(
        `Dokter tidak dapat dihapus karena masih memiliki ${jumlahJanji} janji temu. Nonaktifkan dokter dengan statusAktif = false`,
      );
    }

    await this.dokterRepository.delete(id);
    return { message: `Dokter ${id} berhasil dihapus`, idTerhapus: id };
  }
}

