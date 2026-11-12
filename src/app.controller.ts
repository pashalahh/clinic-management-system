import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service.js';

@Controller()
export class AppController {
  [x: string]: any;
  constructor(private readonly appService: AppService) {}

  // GET / -> cek apakah server hidup (health check sederhana)
    @Get()
    getInfo() {
      return this.appService.getInfo();
    }
}
  