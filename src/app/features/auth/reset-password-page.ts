import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-reset-password-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex min-h-screen items-center justify-center bg-canvas p-4">
      <div class="w-full max-w-sm rounded-card bg-white p-6 shadow-sm">
        <h1 class="mb-1 text-lg font-medium">Reset password</h1>
        <p class="text-muted-foreground text-sm">
          Reset form (Signal Forms) lands with delivery Phase 1 auth work.
        </p>
      </div>
    </div>
  `,
})
export class ResetPasswordPage {}
