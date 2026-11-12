import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

// Definisikan format terlebih dahulu
export interface ResponseStandar<T> {
    success: boolean;
    message: string;
    statusCode: number;
    data: T;
}

// Pesan default berdasarkan HTTP method
const PESAN_METHOD: Record<string, string> = {
    GET: 'Data berhasil diambil',
    POST: 'Data berhasil dibuat',
    PATCH: 'Data berhasil diperbarui',
    PUT: 'Data berhasil diperbarui',
    DELETE: 'Data berhasil dihapus',
};

@Injectable()
export class TransformResponseInterceptor<T> implements NestInterceptor<T, ResponseStandar<T>> {
    intercept(context: ExecutionContext, next: CallHandler): Observable<ResponseStandar<T>> {
        const httpContext = context.switchToHttp();
        const request = httpContext.getRequest();
        const response = httpContext.getResponse();

        return next.handle().pipe(
            map((dataAsli) => ({
                success: true,
                message: PESAN_METHOD[request.method] ?? 'Permintaan berhasil',
                statusCode: response.statusCode,
                data: dataAsli ?? null,
            })),
        );
    }
}
