import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { dashboardAccentColor } from './chart-colors';

@Component({
  selector: 'dt-gauge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg
      viewBox="0 0 120 70"
      class="w-full max-w-[clamp(11.25rem,calc(1.9531vw_+_10.0rem),13.125rem)]"
    >
      <path
        d="M 10 60 A 50 50 0 0 1 110 60"
        fill="none"
        [attr.stroke]="trackColor()"
        stroke-width="5"
        stroke-linecap="round"
      />
      <path
        d="M 10 60 A 50 50 0 0 1 110 60"
        fill="none"
        [attr.stroke]="color()"
        stroke-width="5"
        stroke-linecap="round"
        [attr.stroke-dasharray]="arcLength"
        [attr.stroke-dashoffset]="dashOffset()"
      />
      <text x="60" y="52" text-anchor="middle" class="fill-foreground font-light text-[22px]">
        {{ value() }}{{ valueSuffix() }}
      </text>
      @if (unit()) {
        <text x="60" y="66" text-anchor="middle" class="fill-muted-foreground text-[9px]">
          {{ unit() }}
        </text>
      }
    </svg>
  `,
})
export class DtGauge {
  readonly value = input.required<number>();
  readonly min = input(0);
  readonly max = input(100);
  readonly unit = input('');
  readonly valueSuffix = input('');
  readonly color = input(dashboardAccentColor());
  readonly trackColor = input('var(--border)');

  protected readonly arcLength = Math.PI * 50;

  protected readonly dashOffset = computed(() => {
    const ratio = Math.min(1, Math.max(0, (this.value() - this.min()) / (this.max() - this.min())));
    return this.arcLength * (1 - ratio);
  });
}
