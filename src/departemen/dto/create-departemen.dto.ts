import { IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";

export class CreateDepartemenDto {
    @IsNotEmpty({ message: 'Nama departemen harus diisi' })
    @IsString({ message: 'Nama departemen harus berupa teks' })
    @MaxLength(50, { message: 'Nama departemen maksimal 50 karakter' })
    readonly namaDepartemen: string;

    @IsOptional()
    @IsString({ message: 'Deskripsi harus berupa teks' })
    readonly deskripsi?: string;
}
