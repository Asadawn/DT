import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { NgIcon } from '@ng-icons/core';

@Component({
  selector: 'dt-metric-card',
  imports: [DatePipe, NgIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <div class="rounded-control bg-muted/50 flex flex-col gap-0.5 px-3 py-2">
      <span class="text-muted-foreground flex items-center gap-1 text-xs">
        @if (icon(); as name) {
          <ng-icon [name]="name" size="12" />
        }
        {{ label() }}
      </span>
      <span class="text-sm font-medium">
        {{ value() ?? '—' }}
        @if (unit() && value() !== null && value() !== undefined) {
          <span class="text-muted-foreground font-normal">{{ unit() }}</span>
        }
      </span>
      @if (updatedAt()) {
        <span class="text-muted-foreground text-[10px]">{{ updatedAt() | date: 'short' }}</span>
      }
    </div>
  `,
})
export class DtMetricCard {
  readonly label = input.required<string>();
  readonly value = input<string | number | null>(null);
  readonly unit = input<string>();
  readonly updatedAt = input<string | undefined>(undefined);
  readonly icon = input<string | undefined>(undefined);
}
