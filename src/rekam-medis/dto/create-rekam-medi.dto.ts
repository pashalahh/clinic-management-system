import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Matches, Max, Min } from 'class-validator';

export class CreateRekamMedisDto {
    // janji_temu (1) -> (0..1) rekam_medis
    @IsNotEmpty({ message: 'Janji temu harus diisi' })
    @IsUUID('4', { message: 'janjiTemuId harus berupa UUID yang valid' })
    readonly janjiTemuId: string;

    @IsNotEmpty({ message: 'Catatan kunjungan harus diisi' })
    @IsString({ message: 'Catatan kunjungan harus berupa teks' })
    readonly catatanKunjungan: string;

    @IsOptional()
    @IsString({ message: 'Tindakan harus berupa teks' })
    readonly tindakan?: string;

}
