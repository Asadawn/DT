import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { email, form, required, submit, FormField } from '@angular/forms/signals';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideEye, lucideEyeOff } from '@ng-icons/lucide';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmCheckboxImports } from '@spartan-ng/helm/checkbox';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { AuthService } from '../../core/auth/auth.service';
import { PermissionService } from '../../core/permissions/permission.service';
import { RoleService } from '../../domain/access/role.service';
import { DtAuthBrandingPanel, DtAuthMobileLogo } from '../../shared/ui/auth/auth-branding-panel';
import { seedPermissionsForRole } from './permission-seed';

interface SignInModel {
  email: string;
  password: string;
  rememberMe: boolean;
}

const DEMO_ROLE_BY_EMAIL: Record<string, string> = {
  'admin@example.com': 'r1',
  'manager@example.com': 'r2',
  'technician@example.com': 'r3',
  'viewer@example.com': 'r4',
};

function roleIdForEmail(emailAddress: string): string {
  return DEMO_ROLE_BY_EMAIL[emailAddress.trim().toLowerCase()] ?? 'r1';
}

@Component({
  selector: 'app-sign-in-page',
  imports: [
    FormField,
    RouterLink,
    NgIcon,
    DtAuthBrandingPanel,
    DtAuthMobileLogo,
    ...HlmInputImports,
    ...HlmButtonImports,
    ...HlmCheckboxImports,
  ],
  providers: [provideIcons({ lucideEye, lucideEyeOff })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './sign-in-page.html',
})
export class SignInPage {
  private readonly authService = inject(AuthService);
  private readonly roleService = inject(RoleService);
  private readonly permissionService = inject(PermissionService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly model = signal<SignInModel>({ email: '', password: '', rememberMe: false });
  protected readonly signInForm = form(this.model, (p) => {
    required(p.email, { message: 'Email is required' });
    email(p.email, { message: 'Enter a valid email address' });
    required(p.password, { message: 'Password is required' });
  });

  protected readonly showPassword = signal(false);
  protected togglePasswordVisibility(): void {
    this.showPassword.update((v) => !v);
  }

  protected readonly demoCredentials = computed(() =>
    Object.entries(DEMO_ROLE_BY_EMAIL).map(([demoEmail, roleId]) => ({
      email: demoEmail,
      roleName: this.roleService.role(roleId)?.name ?? roleId,
    })),
  );

  protected readonly submitError = signal<string | null>(null);
  protected readonly submitting = signal(false);

  protected fillDemoCredential(demoEmail: string): void {
    this.model.update((m) => ({ ...m, email: demoEmail, password: 'demo-password' }));
  }

  protected async onSubmit(): Promise<void> {
    this.submitError.set(null);
    this.submitting.set(true);
    try {
      await submit(this.signInForm, async () => {
        try {
          const roleId = roleIdForEmail(this.model().email);
          const user = await this.authService.signIn(
            this.model().email,
            this.model().password,
            roleId,
            this.model().rememberMe,
          );
          await seedPermissionsForRole(user.roleId, this.roleService, this.permissionService);
          const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/dashboard';
          await this.router.navigateByUrl(returnUrl);
        } catch {
          this.submitError.set('Sign-in failed. Please try again.');
        }
      });
    } finally {
      this.submitting.set(false);
    }
  }
}
