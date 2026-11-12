import { IsDateString, IsEnum, IsNotEmpty, IsString, Matches, MaxLength } from "class-validator";
import { JenisKelamin } from "../enums/jenis-kelamin.enum.js";

export class CreatePasienDto {
    @IsNotEmpty({ message: 'Nama lengkap harus diisi' })
    @IsString({ message: 'Nama lengkap harus berupa teks' })
    @MaxLength(150, { message: 'Nama lengkap maksimal 150 karakter' })
    readonly namaLengkap: string;

    @IsNotEmpty({ message: 'NIK harus diisi' })
    @Matches(/^[0-9]{16}$/, { message: 'NIK harus berupa 16 digit angka' })
    readonly nik: string;

    @IsNotEmpty({ message: 'Jenis kelamin harus diisi' })
    @IsEnum(JenisKelamin, { message: 'Jenis kelamin harus LAKI_LAKI atau PEREMPUAN' })
    readonly jenisKelamin: JenisKelamin;

    @IsNotEmpty({ message: 'Tanggal lahir harus diisi' })
    @IsDateString({}, { message: 'Tanggal lahir harus berformat YYYY-MM-DD, contoh: 1999-05-20' })
    readonly tanggalLahir: string;

    @IsNotEmpty({ message: 'Alamat harus diisi' })
    @IsString({ message: 'Alamat harus berupa teks' })
    readonly alamat: string;

    @IsNotEmpty({ message: 'Nomor telepon harus diisi' })
    @Matches(/^(\+62|62|0)8[0-9]{8,11}$/, {
        message: 'Nomor telepon harus berformat nomor seluler Indonesia, contoh: 081234567890',
    })
    readonly nomorTelepon: string;
}
