import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateDepartemenDto } from './dto/create-departemen.dto.js';
import { UpdateDepartemenDto } from './dto/update-departemen.dto.js';
import { InjectRepository } from '@nestjs/typeorm';
import { Dokter } from '../dokter/entities/dokter.entity.js';
import { Repository } from 'typeorm';
import { Departemen } from './entities/departemen.entity.js';

@Injectable()
export class DepartemenService {
  constructor(
    @InjectRepository(Departemen)
    private readonly departemenRepository: Repository<Departemen>,
    @InjectRepository(Dokter)
    private readonly dokterRepository: Repository<Dokter>,
  ) {}
  
  // Memastikan nama departemen belum dipakai (kecuali oleh dirinya sendiri)
  private async namaUnik(nama: string, idSendiri?: string): Promise<void> {
    const sudahAda = await this.departemenRepository.findOneBy({ namaDepartemen: nama });
    if (sudahAda && sudahAda.id !== idSendiri) {
      throw new ConflictException(`Departemen dengan nama "${nama}" sudah ada`);
    }
  }

  async create(dto: CreateDepartemenDto): Promise<Departemen> {
    await this.namaUnik(dto.namaDepartemen);
    const departemenBaru = this.departemenRepository.create(dto);
    return await this.departemenRepository.save(departemenBaru);
  }

  async findAll(): Promise<Departemen[]> {
      return await this.departemenRepository.find({ order: { namaDepartemen: 'ASC' } });
  }

  // Menampilkan 1 departemen beserta daftar dokternya
  async findOne(id: string): Promise<Departemen> {
      const departemen = await this.departemenRepository.findOne({
        where: { id },
        relations: { dokter: true },
      });
      if (!departemen) {
        throw new NotFoundException(`Departemen ${id} tidak ditemukan`);
      }
      return departemen;
  }

  async update(id: string, dto: UpdateDepartemenDto): Promise<Departemen> {
      const departemen = await this.findOne(id);
      if (dto.namaDepartemen) {
        await this.namaUnik(dto.namaDepartemen, id);
      }
      this.departemenRepository.merge(departemen, dto);
      return await this.departemenRepository.save(departemen);
  }

  async remove(id: string): Promise<{ message: string; idTerhapus: string }> {
      await this.findOne(id);

      // Konflik relasi: departemen masih punya dokter
      const jumlahDokter = await this.dokterRepository.countBy({ departemenId: id });
      if (jumlahDokter > 0) {
          throw new ConflictException(
              `Departemen tidak dapat dihapus karena masih memiliki ${jumlahDokter} dokter`,
          );
      }

      await this.departemenRepository.delete(id);
      return { message: `Departemen ${id} berhasil dihapus`, idTerhapus: id };
  }
}
