import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  input,
  signal,
} from '@angular/core';
import { mediaQuerySignal } from '../../utils/media-query.signal';
import { HlmDrawerImports } from '@spartan-ng/helm/drawer';

@Component({
  selector: 'dt-filter-bar',
  imports: [...HlmDrawerImports],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div>
      <div class="flex flex-wrap items-center gap-2">
        <div class="min-w-[180px] max-w-xs flex-1">
          <ng-content select="[primary]" />
        </div>

        @if (!isCompact()) {
          <div class="flex flex-wrap items-center gap-2">
            <ng-content select="[inline]" />
          </div>
        } @else {
          <button
            type="button"
            class="border-border rounded-control flex items-center gap-1.5 border px-3 py-1.5 text-sm"
            (click)="drawerOpen.set(true)"
          >
            Filters
            @if (activeFilterCount() > 0) {
              <span class="bg-primary text-primary-foreground rounded-full px-1.5 text-xs">{{
                activeFilterCount()
              }}</span>
            }
          </button>
        }
      </div>

      @if (isCompact()) {
        <hlm-drawer [state]="drawerOpen() ? 'open' : 'closed'" (closed)="drawerOpen.set(false)">
          <ng-template hlmDrawerPortal>
            <hlm-drawer-content>
              <hlm-drawer-header class="flex-row items-center justify-between">
                <h2 hlmDrawerTitle>Filters</h2>
                <button
                  hlmDrawerClose
                  type="button"
                  class="text-muted-foreground hover:text-foreground"
                  aria-label="Close"
                >
                  ✕
                </button>
              </hlm-drawer-header>
              <div class="flex flex-col gap-3 px-4 pb-4">
                <ng-content select="[inline]" />
              </div>
            </hlm-drawer-content>
          </ng-template>
        </hlm-drawer>
      }
    </div>
  `,
})
export class DtFilterBar {
  readonly activeFilterCount = input(0);
  protected readonly drawerOpen = signal(false);
  protected readonly isCompact = mediaQuerySignal('(max-width: 900px)', inject(DestroyRef));
}
