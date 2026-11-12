import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn, type Relation } from "typeorm";
import { Pasien } from "../../pasien/entities/pasien.entity.js";
import { Dokter } from "../../dokter/entities/dokter.entity.js";
import { StatusJanjiTemu } from "../enums/status-janji-temu.enum.js";
import { RekamMedis } from "../../rekam-medis/entities/rekam-medis.entity.js";

@Entity({ name: 'janji_temu' })
// Mempercepat pengecekan bentrok jadwal dokter
@Index('IDX_janji_temu_dokter_jadwal', ['dokterId', 'jadwal'])
export class JanjiTemu {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    // Dibuat otomatis oleh sistem, contoh: JT-20261109-K7Q2X
    @Column({ name: 'kode_janji_temu', type: 'varchar', length: 30, unique: true })
    kodeJanjiTemu: string;

    // pasien (1) -> (N) janji_temu
    @ManyToOne(() => Pasien, (pasien) => pasien.janjiTemu, {
        nullable: false,
        onDelete: 'RESTRICT',
    })
    @JoinColumn({ name: 'pasien_id' })
    pasien: Relation<Pasien>;

    @Column({ name: 'pasien_id', type: 'uuid' })
    pasienId: string;

    // dokter (1) -> (N) janji_temu
    @ManyToOne(() => Dokter, (dokter) => dokter.janjiTemu, {
        nullable: false,
        onDelete: 'RESTRICT',
    })
    @JoinColumn({ name: 'dokter_id' })
    dokter: Relation<Dokter>;

    @Column({ name: 'dokter_id', type: 'uuid' })
    dokterId: string;

    // timestamptz = timestamp dengan zona waktu (disimpan UTC di database)
    @Column({ type: 'timestamptz' })
    jadwal: Date;

    @Column({ type: 'text' })
    keluhan: string;

    @Column({
        type: 'enum',
        enum: StatusJanjiTemu,
        enumName: 'status_janji_temu_enum',
        default: StatusJanjiTemu.TERJADWAL,
    })
    status: StatusJanjiTemu;

    @Column({ name: 'alasan_pembatalan', type: 'text', nullable: true })
    alasanPembatalan: string | null;

    // janji_temu (1) -> (0..1) rekam_medis
    @OneToOne(() => RekamMedis, (rekamMedis) => rekamMedis.janjiTemu)
    rekamMedis: Relation<RekamMedis> | null;

    @CreateDateColumn({ name: 'dibuat_pada' })
    dibuatPada: Date;

    @UpdateDateColumn({ name: 'diperbarui_pada' })
    diperbaruiPada: Date;
}
