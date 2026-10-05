import { HttpErrorResponse, type HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { LoggerService } from '../observability/logger.service';

export interface StandardApiError {
  status: number;
  message: string;
  correlationId?: string;
}

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const logger = inject(LoggerService);

  return next(req).pipe(
    catchError((error: unknown) => {
      const standardError: StandardApiError =
        error instanceof HttpErrorResponse
          ? {
              status: error.status,
              message: error.error?.message ?? error.message ?? 'Request failed',
              correlationId: error.headers?.get('x-correlation-id') ?? undefined,
            }
          : { status: 0, message: 'Unknown error' };

      logger.error('http_request_failed', { url: req.url, ...standardError });
      return throwError(() => standardError);
    }),
  );
};
