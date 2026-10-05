import { InjectionToken } from '@angular/core';

export interface AppRuntimeConfig {
  readonly mainApiBaseUrl: string;
  readonly deviceApiBaseUrl: string;
  readonly socketUrl: string;
}

export const APP_RUNTIME_CONFIG = new InjectionToken<AppRuntimeConfig>('APP_RUNTIME_CONFIG');

export const DEFAULT_RUNTIME_CONFIG: AppRuntimeConfig = {
  mainApiBaseUrl: '/api',
  deviceApiBaseUrl: '/device-api',
  socketUrl: '/socket',
};
