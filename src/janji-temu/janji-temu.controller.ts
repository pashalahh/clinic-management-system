import { Controller, Get, Post, Body, Param, Delete, ParseUUIDPipe, Put } from '@nestjs/common';
import { JanjiTemuService } from './janji-temu.service.js';
import { CreateJanjiTemuDto } from './dto/create-janji-temu.dto.js';
import { UpdateJanjiTemuDto } from './dto/update-janji-temu.dto.js';

@Controller('janji-temu')
export class JanjiTemuController {
  constructor(private readonly janjiTemuService: JanjiTemuService) {}

  @Post()
    create(@Body() dto: CreateJanjiTemuDto) {
      return this.janjiTemuService.create(dto);
    }

    @Get()
    findAll() {
      return this.janjiTemuService.findAll();
    }

    @Get(':id')
    findOne(@Param('id', ParseUUIDPipe) id: string) {
      return this.janjiTemuService.findOne(id);
    }

    // GET /janji-temu/:id/rekam-medis
    @Get(':id/rekam-medis')
    findRekamMedis(@Param('id', ParseUUIDPipe) id: string) {
      return this.janjiTemuService.findRekamMedis(id);
    }

    @Put(':id')
    update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateJanjiTemuDto) {
      return this.janjiTemuService.update(id, dto);
    }

    @Delete(':id')
    remove(@Param('id', ParseUUIDPipe) id: string) {
      return this.janjiTemuService.remove(id);
    }
}
