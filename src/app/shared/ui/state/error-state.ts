import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { HlmButton } from '@spartan-ng/helm/button';

@Component({
  selector: 'dt-error-state',
  imports: [HlmButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col items-center gap-2 py-12 text-center">
      <span class="text-2xl text-red-600">⚠</span>
      <h3 class="text-sm font-medium">{{ title() }}</h3>
      <p class="text-muted-foreground max-w-sm text-sm">{{ description() }}</p>
      @if (retryable()) {
        <button hlmBtn variant="secondary" size="sm" (click)="retry.emit()">Retry</button>
      }
    </div>
  `,
})
export class DtErrorState {
  readonly title = input('Something went wrong');
  readonly description = input('Unable to load this data. Please try again.');
  readonly retryable = input(true);
  readonly retry = output<void>();
}
