import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-no-permissions-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col items-center gap-2 py-16 text-center">
      <h1 class="text-xl font-medium">No permission</h1>
      <p class="text-muted-foreground max-w-sm text-sm">
        You don't have access to this page. Contact an administrator if you believe this is a
        mistake.
      </p>
    </div>
  `,
})
export class NoPermissionsPage {}
