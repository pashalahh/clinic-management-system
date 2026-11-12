import { PartialType } from '@nestjs/mapped-types';
import { CreateDokterDto } from './create-dokter.dto.js';

export class UpdateDokterDto extends PartialType(CreateDokterDto) {}
