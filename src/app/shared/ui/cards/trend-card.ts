import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

@Component({
  selector: 'dt-trend-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="rounded-card border-border bg-white p-4">
      <div class="text-muted-foreground text-xs">{{ label() }}</div>
      <div class="mt-1 flex items-baseline gap-1">
        <span class="text-2xl font-medium">{{ value() }}</span>
        @if (unit()) {
          <span class="text-muted-foreground text-sm">{{ unit() }}</span>
        }
      </div>
      @if (deltaPercent() !== undefined) {
        <div class="mt-1 flex items-center gap-1 text-xs" [class]="trendClass()">
          <span>{{ trendArrow() }}</span>
          <span>{{ formattedDelta() }}</span>
          <span class="text-muted-foreground">{{ comparisonLabel() }}</span>
        </div>
      }
    </div>
  `,
})
export class DtTrendCard {
  readonly label = input.required<string>();
  readonly value = input<string | number>('');
  readonly unit = input<string>();
  readonly deltaPercent = input<number>();
  readonly comparisonLabel = input('vs previous period');
  readonly lowerIsBetter = input(false);

  protected readonly trendArrow = computed(() => {
    const delta = this.deltaPercent() ?? 0;
    return delta > 0 ? '↑' : delta < 0 ? '↓' : '→';
  });

  protected readonly formattedDelta = computed(() => {
    const delta = this.deltaPercent() ?? 0;
    return `${delta > 0 ? '+' : ''}${delta.toFixed(1)}%`;
  });

  protected readonly trendClass = computed(() => {
    const delta = this.deltaPercent() ?? 0;
    const isGood = this.lowerIsBetter() ? delta <= 0 : delta >= 0;
    if (delta === 0) return 'text-muted-foreground';
    return isGood ? 'text-green-700' : 'text-red-700';
  });
}
