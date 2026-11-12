import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { JenisKelamin } from "../enums/jenis-kelamin.enum.js";
import { JanjiTemu } from "../../janji-temu/entities/janji-temu.entity.js";

@Entity({ name: 'pasien' })
export class Pasien {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    // Dibuat otomatis oleh sistem, contoh: RM-20261109-4821
    @Column({ name: 'nomor_rekam_medis', type: 'varchar', length: 20, unique: true })
    nomorRekamMedis: string;

    @Column({ name: 'nama_lengkap', type: 'varchar', length: 150 })
    namaLengkap: string;

    // NIK fiktif (16 digit)
    @Column({ type: 'varchar', length: 16, unique: true })
    nik: string;

    @Column({
        name: 'jenis_kelamin',
        type: 'enum',
        enum: JenisKelamin,
        enumName: 'jenis_kelamin_enum',
    })
    jenisKelamin: JenisKelamin;

    // tipe 'date' -> hanya tanggal (YYYY-MM-DD), tanpa jam
    @Column({ name: 'tanggal_lahir', type: 'date' })
    tanggalLahir: string;

    @Column({ type: 'text' })
    alamat: string;

    @Column({ name: 'nomor_telepon', type: 'varchar', length: 20 })
    nomorTelepon: string;

    // pasien (1) -> (N) janji_temu
    @OneToMany(() => JanjiTemu, (janjiTemu) => janjiTemu.pasien)
    janjiTemu: JanjiTemu[];

    @CreateDateColumn({ name: 'dibuat_pada' })
    dibuatPada: Date;

    @UpdateDateColumn({ name: 'diperbarui_pada' })
    diperbaruiPada: Date;
}
