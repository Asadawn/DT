import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { email, form, required, submit, FormField } from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { simulateLatency } from '../../shared/utils/simulate-latency';
import { DtAuthBrandingPanel, DtAuthMobileLogo } from '../../shared/ui/auth/auth-branding-panel';

interface ForgotPasswordModel {
  email: string;
}

@Component({
  selector: 'app-forgot-password-page',
  imports: [
    FormField,
    RouterLink,
    DtAuthBrandingPanel,
    DtAuthMobileLogo,
    ...HlmInputImports,
    ...HlmButtonImports,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './forgot-password-page.html',
})
export class ForgotPasswordPage {
  private readonly router = inject(Router);

  protected readonly model = signal<ForgotPasswordModel>({ email: '' });
  protected readonly forgotPasswordForm = form(this.model, (p) => {
    required(p.email, { message: 'Email is required' });
    email(p.email, { message: 'Enter a valid email address' });
  });

  protected readonly submitting = signal(false);

  protected async onSubmit(): Promise<void> {
    this.submitting.set(true);
    try {
      await submit(this.forgotPasswordForm, async () => {
        await simulateLatency(400);
        await this.router.navigate(['/auth/check-email'], {
          queryParams: { email: this.model().email },
        });
      });
    } finally {
      this.submitting.set(false);
    }
  }
}
