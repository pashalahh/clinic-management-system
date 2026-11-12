import { Controller, Get, Post, Body, Param, Delete, ParseUUIDPipe, Patch } from '@nestjs/common';
import { DokterService } from './dokter.service.js';
import { CreateDokterDto } from './dto/create-dokter.dto.js';
import { UpdateDokterDto } from './dto/update-dokter.dto.js';

@Controller('dokter')
export class DokterController {
  constructor(private readonly dokterService: DokterService) {}

  @Post()
  create(@Body() dto: CreateDokterDto) {
    return this.dokterService.create(dto);
  }

  @Get()
  findAll() {
    return this.dokterService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.dokterService.findOne(id);
  }

  // GET /dokter/:id/janji-temu
  @Get(':id/janji-temu')
  findJanjiTemu(@Param('id', ParseUUIDPipe) id: string) {
      return this.dokterService.findJanjiTemu(id);
  }

  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateDokterDto) {
      return this.dokterService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
      return this.dokterService.remove(id);
  }
}
