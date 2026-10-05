import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { HlmBadgeImports } from '@spartan-ng/helm/badge';
import { statusLabel, toneClasses, toneForStatus, type StatusTone } from '../../utils/status-tone';

@Component({
  selector: 'dt-status-chip',
  imports: [...HlmBadgeImports],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span hlmBadge variant="outline" class="gap-1.5" [class]="classes()">
      <span class="h-1.5 w-1.5 rounded-full" [class]="dotClasses()"></span>
      {{ resolvedLabel() }}
    </span>
  `,
})
export class DtStatusChip {
  readonly status = input.required<string>();
  readonly toneOverride = input<StatusTone | undefined>(undefined);
  readonly label = input<string | undefined>(undefined);
  readonly weight = input<'medium' | 'normal'>('medium');

  private readonly resolvedTone = computed<StatusTone>(
    () => this.toneOverride() ?? toneForStatus(this.status()),
  );
  protected readonly classes = computed(() => {
    const toneCls = toneClasses(this.resolvedTone())
      .split(' ')
      .map((cls) => `${cls}!`)
      .join(' ');
    return this.weight() === 'normal' ? `${toneCls} font-normal!` : toneCls;
  });
  protected readonly dotClasses = computed(() => {
    const tone = this.resolvedTone();
    return {
      success: 'bg-green-600',
      warning: 'bg-amber-600',
      danger: 'bg-red-600',
      neutral: 'bg-gray-500',
      info: 'bg-sky-600',
    }[tone];
  });

  protected resolvedLabel(): string {
    return this.label() ?? statusLabel(this.status());
  }
}
