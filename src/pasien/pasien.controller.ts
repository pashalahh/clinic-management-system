import { Controller, Get, Post, Body, Param, Delete, ParseUUIDPipe, Patch } from '@nestjs/common';
import { PasienService } from './pasien.service.js';
import { CreatePasienDto } from './dto/create-pasien.dto.js';
import { UpdatePasienDto } from './dto/update-pasien.dto.js';

@Controller('pasien')
export class PasienController {
  constructor(private readonly pasienService: PasienService) {}

  @Post()
  create(@Body() dto: CreatePasienDto) {
    return this.pasienService.create(dto);
  }

  @Get()
  findAll() {
    return this.pasienService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
      return this.pasienService.findOne(id);
  }

  // GET /pasien/:id/janji-temu
  @Get(':id/janji-temu')
  findJanjiTemu(@Param('id', ParseUUIDPipe) id: string) {
    return this.pasienService.findJanjiTemu(id);
  }

  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdatePasienDto) {
    return this.pasienService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.pasienService.remove(id);
  }
}
