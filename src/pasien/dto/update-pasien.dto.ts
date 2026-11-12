import { PartialType } from '@nestjs/mapped-types';
import { CreatePasienDto } from './create-pasien.dto.js';

export class UpdatePasienDto extends PartialType(CreatePasienDto) {}
