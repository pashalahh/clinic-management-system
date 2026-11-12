import { OmitType, PartialType } from '@nestjs/mapped-types';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { CreateJanjiTemuDto } from './create-janji-temu.dto.js';
import { StatusJanjiTemu } from '../enums/status-janji-temu.enum.js';

// pasienId tidak boleh diganti: janji temu milik pasien yang sama
export class UpdateJanjiTemuDto extends PartialType(
    OmitType(CreateJanjiTemuDto, ['pasienId'] as const),
) {
    @IsOptional()
    @IsEnum(StatusJanjiTemu, {
        message: 'Status harus salah satu dari: TERJADWAL, DIKONFIRMASI, SELESAI, DIBATALKAN',
    })
    readonly status?: StatusJanjiTemu;

    @IsOptional()
    @IsString({ message: 'Alasan pembatalan harus berupa teks' })
    readonly alasanPembatalan?: string;
}
