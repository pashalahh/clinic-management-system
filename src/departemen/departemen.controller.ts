import { Controller, Get, Post, Body, Param, Delete, ParseUUIDPipe, Patch } from '@nestjs/common';
import { DepartemenService } from './departemen.service.js';
import { CreateDepartemenDto } from './dto/create-departemen.dto.js';
import { UpdateDepartemenDto } from './dto/update-departemen.dto.js';


@Controller('departemen')
export class DepartemenController {
  constructor(private readonly departemenService: DepartemenService) {}

  @Post()
  create(@Body() dto: CreateDepartemenDto) {
    return this.departemenService.create(dto);
  }

  @Get()
  findAll() {
    return this.departemenService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.departemenService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateDepartemenDto) {
    return this.departemenService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.departemenService.remove(id);
  }
}
