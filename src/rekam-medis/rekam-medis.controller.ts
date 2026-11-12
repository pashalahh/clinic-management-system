import { Controller, Get, Post, Body, Param, Delete, Put, ParseUUIDPipe } from '@nestjs/common';
import { RekamMedisService } from './rekam-medis.service.js';
import { CreateRekamMedisDto } from './dto/create-rekam-medi.dto.js';
import { UpdateRekamMedisDto } from './dto/update-rekam-medis.dto.js';


@Controller('rekam-medis')
export class RekamMedisController {
  constructor(private readonly rekamMedisService: RekamMedisService) {}

  @Post()
  create(@Body() dto: CreateRekamMedisDto) {
    return this.rekamMedisService.create(dto);
  }

  @Get()
  findAll() {
    return this.rekamMedisService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.rekamMedisService.findOne(id);
  }

  @Put(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateRekamMedisDto) {
    return this.rekamMedisService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.rekamMedisService.remove(id);
  }
}
