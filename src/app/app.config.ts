import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { routes } from './app.routes';
import { authInterceptor } from './core/http/auth.interceptor';
import { errorInterceptor } from './core/http/error.interceptor';
import { APP_RUNTIME_CONFIG, DEFAULT_RUNTIME_CONFIG } from './core/config/app-runtime-config';
import { AuthService } from './core/auth/auth.service';
import { PermissionService } from './core/permissions/permission.service';
import { RoleService } from './domain/access/role.service';
import { seedPermissionsForRole } from './features/auth/permission-seed';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])),
    { provide: APP_RUNTIME_CONFIG, useValue: DEFAULT_RUNTIME_CONFIG },
    provideAppInitializer(async () => {
      const authService = inject(AuthService);
      const user = authService.currentUser();
      if (!user) return;
      await seedPermissionsForRole(user.roleId, inject(RoleService), inject(PermissionService));
    }),
  ],
};
