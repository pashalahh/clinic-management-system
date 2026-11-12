import { IsBoolean, IsEmail, IsNotEmpty, IsOptional, IsString, IsUUID, Matches, MaxLength } from "class-validator";

export class CreateDokterDto {
    // departemen (1) -> (N) dokter
    @IsNotEmpty({ message: 'Departemen harus diisi' })
    @IsUUID('4', { message: 'departemenId harus berupa UUID yang valid' })
    readonly departemenId: string;

    @IsNotEmpty({ message: 'Nama lengkap harus diisi' })
    @IsString({ message: 'Nama lengkap harus berupa teks' })
    @MaxLength(100, { message: 'Nama lengkap maksimal 100 karakter' })
    readonly namaLengkap: string;

    @IsNotEmpty({ message: 'Nomor STR harus diisi' })
    @IsString({ message: 'Nomor STR harus berupa teks' })
    @MaxLength(30, { message: 'Nomor STR maksimal 30 karakter' })
    readonly nomorStr: string;

    @IsNotEmpty({ message: 'Spesialisasi harus diisi' })
    @IsString({ message: 'Spesialisasi harus berupa teks' })
    @MaxLength(100, { message: 'Spesialisasi maksimal 100 karakter' })
    readonly spesialisasi: string;

    @IsNotEmpty({ message: 'Email harus diisi' })
    @IsEmail({}, { message: 'Format email tidak valid' })
    @MaxLength(100, { message: 'Email maksimal 100 karakter' })
    readonly email: string;

    @IsNotEmpty({ message: 'Nomor telepon harus diisi' })
    @Matches(/^(\+62|62|0)8[0-9]{8,11}$/, {
        message: 'Nomor telepon harus berformat nomor seluler Indonesia, contoh: 081234567890',
    })
    readonly nomorTelepon: string;

    @IsOptional()
    @IsBoolean({ message: 'statusAktif harus berupa true atau false' })
    readonly statusAktif?: boolean;
}
