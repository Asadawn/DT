import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { DtEmptyState } from '../state/empty-state';
import { DtErrorState } from '../state/error-state';
import { DtSkeleton } from '../state/skeleton';

@Component({
  selector: 'dt-chart-card',
  imports: [DtSkeleton, DtEmptyState, DtErrorState],
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="rounded-card border-border flex h-full flex-col gap-2 border bg-white p-4">
      @if (title()) {
        <div class="flex items-center justify-between gap-2">
          <h3 class="text-sm font-medium">{{ title() }}</h3>
          <ng-content select="[actions]" />
        </div>
      }
      @if (loading()) {
        <div class="h-56 w-full"><dt-skeleton /></div>
      } @else if (error()) {
        <dt-error-state title="Unable to retrieve telemetry" [description]="errorDescription()" />
      } @else if (noData()) {
        <dt-empty-state icon="▥" title="No data" [description]="noDataDescription()" />
      } @else {
        <ng-content />
      }
    </div>
  `,
})
export class DtChartCard {
  readonly title = input<string>();
  readonly loading = input(false);
  readonly error = input(false);
  readonly errorDescription = input('Telemetry request failed. Try again shortly.');
  readonly noData = input(false);
  readonly noDataDescription = input('No readings for this period.');
}
