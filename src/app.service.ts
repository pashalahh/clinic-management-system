import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getInfo() {
    return {
      nama: 'API Clinic Management System',
      versi: '1.0.0',
      status: 'berjalan',
    };
  }
}
