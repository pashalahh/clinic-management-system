import { IsDateString, IsNotEmpty, IsString, IsUUID, MaxLength } from "class-validator";

export class CreateJanjiTemuDto {
    // pasien (1) -> (N) janji_temu
    @IsNotEmpty({ message: 'Pasien harus diisi' })
    @IsUUID('4', { message: 'pasienId harus berupa UUID yang valid' })
    readonly pasienId: string;

    // dokter (1) -> (N) janji_temu
    @IsNotEmpty({ message: 'Dokter harus diisi' })
    @IsUUID('4', { message: 'dokterId harus berupa UUID yang valid' })
    readonly dokterId: string;

    @IsNotEmpty({ message: 'Jadwal harus diisi' })
    @IsDateString({}, { message: 'Jadwal harus berformat tanggal-waktu ISO 8601, contoh: 2026-11-20T09:00:00+07:00' })
    readonly jadwal: string;

    @IsNotEmpty({ message: 'Keluhan harus diisi' })
    @IsString({ message: 'Keluhan harus berupa teks' })
    @MaxLength(500, { message: 'Keluhan maksimal 500 karakter' })
    readonly keluhan: string;
}
