import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { HlmCardImports } from '@spartan-ng/helm/card';
import type { StatusTone } from '../../utils/status-tone';

export interface StatusSummaryItem {
  label: string;
  count: number;
  tone: StatusTone;
}

const DOT_CLASSES: Record<StatusTone, string> = {
  success: 'bg-dashboard-accent',
  warning: 'bg-amber-500',
  danger: 'bg-red-500',
  neutral: 'bg-gray-400',
  info: 'bg-sky-500',
};

@Component({
  selector: 'dt-status-summary',
  imports: [...HlmCardImports],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <div hlmCard size="sm">
      <div hlmCardContent>
        @if (title()) {
          <h3 class="mb-3 text-sm font-medium">{{ title() }}</h3>
        }
        @if (total() === 0) {
          <p class="text-muted-foreground text-sm">No data yet.</p>
        } @else {
          <div class="bg-muted mb-3 flex h-2 w-full overflow-hidden rounded-full">
            @for (item of items(); track item.label) {
              @if (item.count > 0) {
                <span
                  [class]="dotClass(item.tone)"
                  [style.width.%]="(item.count / total()) * 100"
                ></span>
              }
            }
          </div>
          <div class="flex flex-wrap gap-x-5 gap-y-2">
            @for (item of items(); track item.label) {
              <div class="flex items-center gap-1.5 text-xs">
                <span class="h-2 w-2 shrink-0 rounded-full" [class]="dotClass(item.tone)"></span>
                <span class="text-muted-foreground">{{ item.label }}</span>
                <span class="font-medium">{{ item.count }}</span>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
})
export class DtStatusSummary {
  readonly title = input<string>();
  readonly items = input.required<StatusSummaryItem[]>();

  protected readonly total = computed(() =>
    this.items().reduce((sum, item) => sum + item.count, 0),
  );

  protected dotClass(tone: StatusTone): string {
    return DOT_CLASSES[tone];
  }
}
