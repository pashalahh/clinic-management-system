import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateJanjiTemuDto } from './dto/create-janji-temu.dto.js';
import { UpdateJanjiTemuDto } from './dto/update-janji-temu.dto.js';
import { STATUS_AKTIF, StatusJanjiTemu, TRANSISI_STATUS } from './enums/status-janji-temu.enum.js';
import { JanjiTemu } from './entities/janji-temu.entity.js';
import { RekamMedis } from '../rekam-medis/entities/rekam-medis.entity.js';
import { InjectRepository } from '@nestjs/typeorm';
import { Pasien } from '../pasien/entities/pasien.entity.js';
import { Dokter } from '../dokter/entities/dokter.entity.js';
import { In, Not, Repository } from 'typeorm';
import { buatKodeJanjiTemu } from '../common/utils/buat-kode.js';

@Injectable()
export class JanjiTemuService {
  constructor(
    @InjectRepository(JanjiTemu)
    private readonly janjiTemuRepository: Repository<JanjiTemu>,
    @InjectRepository(Pasien)
    private readonly pasienRepository: Repository<Pasien>,
    @InjectRepository(Dokter)
    private readonly dokterRepository: Repository<Dokter>,
    @InjectRepository(RekamMedis)
    private readonly rekamMedisRepository: Repository<RekamMedis>,
  ) {}

  // Mengambil janji temu tanpa relasi (untuk proses update/hapus)
  private async ambil(id: string): Promise<JanjiTemu> {
    const janjiTemu = await this.janjiTemuRepository.findOneBy({ id });
    if (!janjiTemu) {
      throw new NotFoundException(`Janji temu ${id} tidak ditemukan`);
    }
    return janjiTemu;
  }

  private async ambilDokterAktif(dokterId: string): Promise<Dokter> {
    const dokter = await this.dokterRepository.findOneBy({ id: dokterId });
    if (!dokter) {
      throw new NotFoundException(`Dokter ${dokterId} tidak ditemukan`);
    }
    if (!dokter.statusAktif) {
      throw new BadRequestException(`Dokter ${dokter.namaLengkap} sedang tidak aktif`);
    }
    return dokter;
  }

  private cekJadwal(jadwal: Date): void {
    if (jadwal.getTime() <= Date.now()) {
      throw new BadRequestException('Jadwal janji temu harus di masa depan');
    }
  }

  // Aturan bentrok: dokter / pasien tidak boleh punya 2 janji aktif di waktu yang sama
  private async pastikanTidakBentrok(
    dokterId: string,
    pasienId: string,
    jadwal: Date,
    kecualiId?: string,
): Promise<void> {
    const kecuali = kecualiId ? { id: Not(kecualiId) } : {};

    const bentrokDokter = await this.janjiTemuRepository.findOne({
      where: { dokterId, jadwal, status: In(STATUS_AKTIF), ...kecuali },
    });
    if (bentrokDokter) {
      throw new ConflictException('Dokter sudah memiliki janji temu pada jadwal tersebut');
    }

    const bentrokPasien = await this.janjiTemuRepository.findOne({
      where: { pasienId, jadwal, status: In(STATUS_AKTIF), ...kecuali },
    });
    if (bentrokPasien) {
      throw new ConflictException('Pasien sudah memiliki janji temu pada jadwal tersebut');
    }
  }

  async create(dto: CreateJanjiTemuDto): Promise<JanjiTemu> {
    const pasien = await this.pasienRepository.findOneBy({ id: dto.pasienId });
    if (!pasien) {
      throw new NotFoundException(`Pasien ${dto.pasienId} tidak ditemukan`);
    }
    await this.ambilDokterAktif(dto.dokterId);

    const jadwal = new Date(dto.jadwal);
    this.cekJadwal(jadwal);
    await this.pastikanTidakBentrok(dto.dokterId, dto.pasienId, jadwal);

    const janjiBaru = this.janjiTemuRepository.create({
      kodeJanjiTemu: buatKodeJanjiTemu(),
      pasienId: dto.pasienId,
      dokterId: dto.dokterId,
      jadwal,
      keluhan: dto.keluhan,
      status: StatusJanjiTemu.TERJADWAL,
    });
    const tersimpan = await this.janjiTemuRepository.save(janjiBaru);
    return await this.findOne(tersimpan.id);
  }

  async findAll(): Promise<JanjiTemu[]> {
    return await this.janjiTemuRepository.find({
      relations: { pasien: true, dokter: true },
      order: { jadwal: 'ASC' },
    });
  }

  async findOne(id: string): Promise<JanjiTemu> {
    const janjiTemu = await this.janjiTemuRepository.findOne({
      where: { id },
      relations: { pasien: true, dokter: { departemen: true }, rekamMedis: true },
    });
    if (!janjiTemu) {
      throw new NotFoundException(`Janji temu ${id} tidak ditemukan`);
    }
    return janjiTemu;
  }

  // Menampilkan catatan kunjungan milik sebuah janji temu
  async findRekamMedis(id: string): Promise<RekamMedis> {
    await this.ambil(id);
    const rekamMedis = await this.rekamMedisRepository.findOneBy({ janjiTemuId: id });
    if (!rekamMedis) {
      throw new NotFoundException(`Janji temu ${id} belum memiliki rekam medis`);
    }
    return rekamMedis;
  }

  // Mengubah dokter / jadwal / keluhan / status dalam satu endpoint PATCH /janji-temu/:id
  async update(id: string, dto: UpdateJanjiTemuDto): Promise<JanjiTemu> {
    const janjiTemu = await this.ambil(id);

    // Jika mengubah jadwal, dokter, atau keluhan
    if (dto.dokterId || dto.jadwal || dto.keluhan !== undefined) {
      if (!STATUS_AKTIF.includes(janjiTemu.status)) {
        throw new ConflictException(
          `Janji temu berstatus ${janjiTemu.status} tidak dapat diubah jadwal atau dokternya`,
        );
      }

      const dokterId = dto.dokterId ?? janjiTemu.dokterId;
      const jadwal = dto.jadwal ? new Date(dto.jadwal) : janjiTemu.jadwal;

      if (dto.dokterId) {
        await this.ambilDokterAktif(dto.dokterId);
      }
      if (dto.jadwal) {
        this.cekJadwal(jadwal);
      }
      if (dto.dokterId || dto.jadwal) {
        await this.pastikanTidakBentrok(dokterId, janjiTemu.pasienId, jadwal, id);
      }

      janjiTemu.dokterId = dokterId;
      janjiTemu.jadwal = jadwal;
      if (dto.keluhan !== undefined) {
        janjiTemu.keluhan = dto.keluhan;
      }
    }

    // Jika mengubah status janji temu
    if (dto.status && dto.status !== janjiTemu.status) {
      const statusDiizinkan = TRANSISI_STATUS[janjiTemu.status];
      if (!statusDiizinkan.includes(dto.status)) {
        const daftar = statusDiizinkan.length ? statusDiizinkan.join(', ') : 'tidak ada (status akhir)';
        throw new ConflictException(
          `Status tidak dapat diubah dari ${janjiTemu.status} ke ${dto.status}. Perubahan yang diizinkan: ${daftar}`,
        );
      }

      if (dto.status === StatusJanjiTemu.DIBATALKAN) {
        if (!dto.alasanPembatalan || !dto.alasanPembatalan.trim()) {
          throw new BadRequestException('Alasan pembatalan wajib diisi jika status DIBATALKAN');
        }
        janjiTemu.alasanPembatalan = dto.alasanPembatalan.trim();
      }

      janjiTemu.status = dto.status;
    }

    await this.janjiTemuRepository.save(janjiTemu);
    return await this.findOne(id);
  }

  async remove(id: string): Promise<{ message: string; idTerhapus: string }> {
    await this.ambil(id);

    // Konflik relasi: janji temu sudah punya rekam medis
    const jumlahRekam = await this.rekamMedisRepository.countBy({ janjiTemuId: id });
    if (jumlahRekam > 0) {
      throw new ConflictException(
        'Janji temu tidak dapat dihapus karena sudah memiliki rekam medis',
      );
    }

    await this.janjiTemuRepository.delete(id);
    return { message: `Janji temu ${id} berhasil dihapus`, idTerhapus: id };
  }
}
