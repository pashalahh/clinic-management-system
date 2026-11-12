import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateRekamMedisDto } from './create-rekam-medi.dto.js';

// janjiTemuId tidak boleh diganti: rekam medis terikat pada satu janji temu
export class UpdateRekamMedisDto extends PartialType(
    OmitType(CreateRekamMedisDto, ['janjiTemuId'] as const),
) {}
