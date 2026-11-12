import { Column, CreateDateColumn, DeleteDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, type Relation, UpdateDateColumn } from "typeorm";
import { JanjiTemu } from "../../janji-temu/entities/janji-temu.entity.js";
import { Departemen } from "../../departemen/entities/departemen.entity.js";

@Entity({ name: 'dokter' })
export class Dokter {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    // departemen (1) -> (N) dokter
    @ManyToOne(() => Departemen, (departemen) => departemen.dokter, {
        nullable: false,
        onDelete: 'RESTRICT',
    })
    @JoinColumn({ name: 'departemen_id' })
    departemen: Relation<Departemen>;

    @Column({ name: 'departemen_id', type: 'uuid' })
    departemenId: string;

    @Column({ name: 'nama_lengkap', type: 'varchar', length: 100 })
    namaLengkap: string;

    // Nomor STR (Surat Tanda Registrasi) dokter - fiktif
    @Column({ name: 'nomor_str', type: 'varchar', length: 30, unique: true })
    nomorStr: string;

    @Column({ type: 'varchar', length: 100 })
    spesialisasi: string;

    @Column({ type: 'varchar', length: 100, unique: true })
    email: string;

    @Column({ name: 'nomor_telepon', type: 'varchar', length: 20 })
    nomorTelepon: string;

    @Column({ name: 'status_aktif', type: 'boolean', default: true })
    statusAktif: boolean;

    // dokter (1) -> (N) janji_temu
    @OneToMany(() => JanjiTemu, (janjiTemu) => janjiTemu.dokter)
    janjiTemu: JanjiTemu[];

    @CreateDateColumn({ name: 'dibuat_pada' })
    dibuatPada: Date;

    @UpdateDateColumn({ name: 'diperbarui_pada' })
    diperbaruiPada: Date;

    @DeleteDateColumn({name: 'dihapus_pada'})
    dihapusPada: Date;
}
