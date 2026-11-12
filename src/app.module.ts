import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PasienModule } from './pasien/pasien.module.js';
import { DokterModule } from './dokter/dokter.module.js';
import { DepartemenModule } from './departemen/departemen.module.js';
import { JanjiTemuModule } from './janji-temu/janji-temu.module.js';
import { RekamMedisModule } from './rekam-medis/rekam-medis.module.js';
import Joi from 'joi';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LogMiddlewareMiddleware } from './middleware/log-middleware/log-middleware.middleware.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        PORT: Joi.number().default(3000),
        NODE_ENV: Joi.string().valid('development', 'staging', 'production').default('development'),
        DB_HOST: Joi.string().required(),
        DB_PORT: Joi.number().default(5432),
        DB_USERNAME: Joi.string().required(),
        DB_PASSWORD: Joi.string().required(),
        DB_DATABASE: Joi.string().required(),
      }),
    }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_DATABASE'),

        autoLoadEntities: true,

        // Tabel dibuat/diubah otomatis hanya saat development
        synchronize: configService.get<string>('NODE_ENV') === 'development',
      }),
    }),

    PasienModule, 
    DokterModule, 
    DepartemenModule, 
    JanjiTemuModule, 
    RekamMedisModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LogMiddlewareMiddleware).forRoutes('*');
  }
}
