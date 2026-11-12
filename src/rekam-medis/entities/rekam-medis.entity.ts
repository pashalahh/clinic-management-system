import { Column, CreateDateColumn, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn, type Relation } from "typeorm";
import { JanjiTemu } from "../../janji-temu/entities/janji-temu.entity.js";
import { desimalTransformer } from "../../common/transformers/desimal.transformer.js";

@Entity({ name: 'rekam_medis' })
export class RekamMedis {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    // janji_temu (1) -> (0..1) rekam_medis
    // OneToOne otomatis membuat constraint UNIQUE pada janji_temu_id
    @OneToOne(() => JanjiTemu, (janjiTemu) => janjiTemu.rekamMedis, {
        nullable: false,
        onDelete: 'RESTRICT',
    })
    @JoinColumn({ name: 'janji_temu_id' })
    janjiTemu: Relation<JanjiTemu>;

    @Column({ name: 'janji_temu_id', type: 'uuid' })
    janjiTemuId: string;

    @Column({ name: 'catatan_kunjungan', type: 'text' })
    catatanKunjungan: string;

    // Tindakan umum (bukan diagnosis klinis), contoh: "Observasi, istirahat cukup"
    @Column({ type: 'text', nullable: true })
    tindakan: string | null;

    @CreateDateColumn({ name: 'dibuat_pada' })
    dibuatPada: Date;

    @UpdateDateColumn({ name: 'diperbarui_pada' })
    diperbaruiPada: Date;
}
