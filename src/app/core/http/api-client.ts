import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { APP_RUNTIME_CONFIG } from '../config/app-runtime-config';

export type ApiQueryParams = Record<string, string | number | boolean | undefined | null>;

function toHttpParams(query?: ApiQueryParams): HttpParams | undefined {
  if (!query) return undefined;
  let params = new HttpParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null) {
      params = params.set(key, String(value));
    }
  }
  return params;
}

function joinUrl(base: string, path: string): string {
  return `${base.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
}

@Injectable({ providedIn: 'root' })
export class ApiClient {
  private readonly http = inject(HttpClient);
  private readonly config = inject(APP_RUNTIME_CONFIG);

  get<T>(path: string, query?: ApiQueryParams, host: 'main' | 'device' = 'main') {
    return this.http.get<T>(this.resolve(path, host), { params: toHttpParams(query) });
  }

  post<T>(path: string, body: unknown, host: 'main' | 'device' = 'main') {
    return this.http.post<T>(this.resolve(path, host), body);
  }

  put<T>(path: string, body: unknown, host: 'main' | 'device' = 'main') {
    return this.http.put<T>(this.resolve(path, host), body);
  }

  patch<T>(path: string, body: unknown, host: 'main' | 'device' = 'main') {
    return this.http.patch<T>(this.resolve(path, host), body);
  }

  delete<T>(path: string, host: 'main' | 'device' = 'main') {
    return this.http.delete<T>(this.resolve(path, host));
  }

  upload<T>(path: string, formData: FormData, host: 'main' | 'device' = 'main') {
    return this.http.post<T>(this.resolve(path, host), formData);
  }

  private resolve(path: string, host: 'main' | 'device'): string {
    const base = host === 'device' ? this.config.deviceApiBaseUrl : this.config.mainApiBaseUrl;
    return joinUrl(base, path);
  }
}
