import { ChangeDetectionStrategy, Component, model } from '@angular/core';
import { HlmToggleGroupImports } from '@spartan-ng/helm/toggle-group';

export interface ChartRangeSegment {
  id: string;
  label: string;
}

export const DEFAULT_CHART_RANGE_SEGMENTS: ChartRangeSegment[] = [
  { id: '6h', label: '6H' },
  { id: '24h', label: '24H' },
  { id: '7d', label: '7D' },
  { id: '30d', label: '30D' },
  { id: '6m', label: '6M' },
];

@Component({
  selector: 'dt-chart-range-toggle',
  imports: [...HlmToggleGroupImports],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      hlmToggleGroup
      type="single"
      [value]="rangeId()"
      (valueChange)="rangeId.set($any($event) ?? rangeId())"
    >
      @for (segment of segments; track segment.id) {
        <button hlmToggleGroupItem [value]="segment.id">{{ segment.label }}</button>
      }
    </div>
  `,
})
export class DtChartRangeToggle {
  readonly rangeId = model.required<string>();
  protected readonly segments = DEFAULT_CHART_RANGE_SEGMENTS;
}
