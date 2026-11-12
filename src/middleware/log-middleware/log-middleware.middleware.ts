import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { Request,Response,NextFunction } from 'express';

@Injectable()
export class LogMiddlewareMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP')

  use(req: Request, res: Response, next: NextFunction) {
    const {method, originalUrl, ip} = req;
    const userAgent = req.get('user-agent') || 'tidak diketahui';
    const startTime = Date.now();

    // Jika sudah finish
    res.on('finish',() => {
      // Status code : berhasil atau tidak
      const {statusCode} = res;

      // Durasi
      const duration = Date.now() - startTime;

      // Tentukkan pesannya
      const logMessage =`[
      
      ${method}
      ${originalUrl}
      --
      Status : ${statusCode}
      --
      Durasi : ${duration}ms
      --
      IP Address : ${ip}
      --
      Agent : ${userAgent}
      
      ]`

      if(statusCode >= 500){
        this.logger.error(logMessage);
      }else if(statusCode >= 400){
        this.logger.warn(logMessage);
      }else{
        this.logger.log(logMessage);
      }
    })
    next();
  }
}
