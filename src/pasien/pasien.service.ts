import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreatePasienDto } from './dto/create-pasien.dto.js';
import { UpdatePasienDto } from './dto/update-pasien.dto.js';
import { InjectRepository } from '@nestjs/typeorm';
import { Pasien } from './entities/pasien.entity.js';
import { JanjiTemu } from '../janji-temu/entities/janji-temu.entity.js';
import { Repository } from 'typeorm';
import { buatNomorRekamMedis } from '../common/utils/buat-kode.js';

@Injectable()
export class PasienService {
  constructor(
    @InjectRepository(Pasien)
    private readonly pasienRepository: Repository<Pasien>,
    @InjectRepository(JanjiTemu)
    private readonly janjiTemuRepository: Repository<JanjiTemu>,
  ) {}

  private cekTanggalLahir(tanggalLahir: string): void {
    if (new Date(tanggalLahir) > new Date()) {
      throw new BadRequestException('Tanggal lahir tidak boleh di masa depan');
    }
  }

  private async nikUnik(nik: string, idSendiri?: string): Promise<void> {
    const ada = await this.pasienRepository.findOneBy({ nik });
    if (ada && ada.id !== idSendiri) {
      throw new ConflictException(`NIK ${nik} sudah terdaftar`);
    }
}

// Membuat nomor rekam medis unik (coba maksimal 5 kali jika kebetulan bentrok)
private async buatNomorUnik(): Promise<string> {
    for (let i = 0; i < 5; i++) {
      const nomor = buatNomorRekamMedis();
      const ada = await this.pasienRepository.findOneBy({ nomorRekamMedis: nomor });
      if (!ada) return nomor;
    }
    throw new ConflictException('Gagal membuat nomor rekam medis, silakan coba lagi');
  }

  async create(dto: CreatePasienDto): Promise<Pasien> {
    this.cekTanggalLahir(dto.tanggalLahir);
    await this.nikUnik(dto.nik);

    const pasienBaru = this.pasienRepository.create({
      ...dto,
      nomorRekamMedis: await this.buatNomorUnik(),
    });
    return await this.pasienRepository.save(pasienBaru);
  }

  async findAll(): Promise<Pasien[]> {
    return await this.pasienRepository.find({
      order: { dibuatPada: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Pasien> {
    const pasien = await this.pasienRepository.findOneBy({ id });
    if (!pasien) {
      throw new NotFoundException(`Pasien ${id} tidak ditemukan`);
    }
    return pasien;
  }

  // Daftar janji temu milik seorang pasien
  async findJanjiTemu(id: string): Promise<JanjiTemu[]> {
    await this.findOne(id);
    return await this.janjiTemuRepository.find({
      where: { pasienId: id },
      relations: { dokter: true },
      order: { jadwal: 'DESC' },
    });
  }

  async update(id: string, dto: UpdatePasienDto): Promise<Pasien> {
    const pasien = await this.findOne(id);

    if (dto.tanggalLahir) {
      this.cekTanggalLahir(dto.tanggalLahir);
    }
    if (dto.nik) {
      await this.nikUnik(dto.nik, id);
    }

    this.pasienRepository.merge(pasien, dto);
    return await this.pasienRepository.save(pasien);
  }

  async remove(id: string): Promise<{ message: string; idTerhapus: string }> {
    await this.findOne(id);

    // Konflik relasi: pasien masih punya janji temu
    const jumlahJanji = await this.janjiTemuRepository.countBy({ pasienId: id });
    if (jumlahJanji > 0) {
      throw new ConflictException(
        `Pasien tidak dapat dihapus karena masih memiliki ${jumlahJanji} janji temu`,
      );
    }

    await this.pasienRepository.delete(id);
    return { message: `Pasien ${id} berhasil dihapus`, idTerhapus: id };
  }
}
