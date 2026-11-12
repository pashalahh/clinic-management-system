import { Column, CreateDateColumn, DeleteDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Dokter } from "../../dokter/entities/dokter.entity.js";

@Entity({ name: 'departemen' })
export class Departemen {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'nama_departemen', type: 'varchar', length: 50, unique: true })
    namaDepartemen: string;

    @Column({ type: 'text', nullable: true })
    deskripsi: string | null;

    // departemen (1) -> (N) dokter
    @OneToMany(() => Dokter, (dokter) => dokter.departemen)
    dokter: Dokter[];

    @CreateDateColumn({ name: 'dibuat_pada' })
    dibuatPada: Date;

    @UpdateDateColumn({ name: 'diperbarui_pada' })
    diperbaruiPada: Date;

    @DeleteDateColumn({name: 'dihapus_pada'})
    dihapusPada: Date;
}
