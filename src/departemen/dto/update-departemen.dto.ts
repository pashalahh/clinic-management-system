import { PartialType } from '@nestjs/mapped-types';
import { CreateDepartemenDto } from './create-departemen.dto.js';

export class UpdateDepartemenDto extends PartialType(CreateDepartemenDto) {}
