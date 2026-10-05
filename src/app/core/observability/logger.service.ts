import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LoggerService {
  event(name: string, data?: Record<string, unknown>): void {
    console.info(`[event] ${name}`, data ?? {});
  }

  error(name: string, data?: Record<string, unknown>): void {
    console.error(`[error] ${name}`, data ?? {});
  }
}
