import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { toneClasses, type StatusTone } from '../../utils/status-tone';

@Component({
  selector: 'dt-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span
      class="rounded-control inline-flex items-center px-2 py-0.5 text-xs font-medium"
      [class]="classes()"
    >
      <ng-content />
    </span>
  `,
})
export class DtBadge {
  readonly tone = input<StatusTone>('neutral');
  protected readonly classes = computed(() => toneClasses(this.tone()));
}
