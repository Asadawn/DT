import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'dt-empty-state',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col items-center gap-2 py-12 text-center">
      <span class="text-muted-foreground text-2xl">{{ icon() }}</span>
      <h3 class="text-sm font-medium">{{ title() }}</h3>
      @if (description()) {
        <p class="text-muted-foreground max-w-sm text-sm">{{ description() }}</p>
      }
      <div class="mt-2">
        <ng-content />
      </div>
    </div>
  `,
})
export class DtEmptyState {
  readonly icon = input('○');
  readonly title = input.required<string>();
  readonly description = input<string>();
}
