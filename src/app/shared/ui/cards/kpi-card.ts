import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideArrowDown, lucideArrowUp, lucideMinus } from '@ng-icons/lucide';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { DtSkeleton } from '../state/skeleton';
import { DtStatusChip } from '../badge/status-chip';
import type { StatusTone } from '../../utils/status-tone';

export interface KpiBarSegment {
  value: number;
  colorClass: string;
}

@Component({
  selector: 'dt-kpi-card',
  imports: [DtSkeleton, DtStatusChip, NgIcon, ...HlmCardImports],
  providers: [provideIcons({ lucideArrowDown, lucideArrowUp, lucideMinus })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block min-h-0' },
  template: `
    <div
      hlmCard
      class="@container ring-black/5 flex h-full min-h-0 flex-col rounded-2xl shadow-sm ring-1 [--card-spacing:clamp(1.0rem,calc(0.7812vw_+_0.5rem),1.75rem)]"
    >
      @if (legacyLayout()) {
        <!-- Dashboard's original layout — kept pixel-for-pixel as it was before the Devices-page KPI redesign below, on request (that redesign is intentionally scoped to every other consumer, not the Dashboard hero row). -->
        <div
          hlmCardContent
          class="flex min-h-0 flex-1 flex-col px-[clamp(0.875rem,calc(0.3906vw_+_0.625rem),1.25rem)]"
        >
          @if (ngIcon()) {
            <span
              class="flex h-[clamp(1.75rem,calc(1.3021vw_+_0.9167rem),3.0rem)] w-[clamp(1.75rem,calc(1.3021vw_+_0.9167rem),3.0rem)] shrink-0 items-center justify-center rounded-full text-[clamp(1rem,calc(0.5208vw_+_0.6667rem),1.5rem)]"
              [class]="iconToneClasses()"
            >
              <ng-icon [name]="ngIcon()!" size="1em" />
            </span>
          } @else if (icon()) {
            <span
              class="flex h-[clamp(1.75rem,calc(1.3021vw_+_0.9167rem),3.0rem)] w-[clamp(1.75rem,calc(1.3021vw_+_0.9167rem),3.0rem)] shrink-0 items-center justify-center rounded-full text-base"
              [class]="iconToneClasses()"
              >{{ icon() }}</span
            >
          }

          <span
            class="text-muted-foreground mt-1 block text-[clamp(0.6875rem,calc(0.3255vw_+_0.4792rem),1.0rem)] leading-tight font-medium"
            >{{ label() }}</span
          >

          @if (loading()) {
            <div class="mt-2 h-9 w-20"><dt-skeleton /></div>
          } @else {
            <div class="mt-1 flex flex-wrap items-baseline gap-x-1.5">
              <span
                class="font-light text-[clamp(1.5rem,calc(1.3021vw_+_0.6667rem),2.75rem)] tracking-tight"
                >{{ value() }}</span
              >
              @if (unit()) {
                <span
                  class="text-muted-foreground text-[clamp(0.75rem,calc(0.3906vw_+_0.5rem),1.125rem)] font-medium"
                  >{{ unit() }}</span
                >
              }
            </div>
          }

          <div class="mt-auto w-full pt-1">
            @if (barSegments(); as segments) {
              <div class="bg-muted flex h-1.5 w-full overflow-hidden rounded-full">
                @for (segment of segments; track $index) {
                  @if (segment.value > 0) {
                    <span [class]="segment.colorClass" [style.width.%]="segment.value"></span>
                  }
                }
              </div>
            } @else if (spark(); as points) {
              @if (points.length > 0) {
                <div
                  class="flex h-[clamp(1.0rem,calc(1.0417vw_+_0.3333rem),2.0rem)] items-end gap-[2px]"
                >
                  @for (point of points; track $index) {
                    <span
                      class="bg-dashboard-accent/60 min-w-0 max-w-[4px] flex-1 rounded-full"
                      [style.height.%]="sparkHeight(point)"
                    ></span>
                  }
                </div>
              }
            }

            @if (!loading()) {
              @if (delta() !== null) {
                <div
                  class="mt-1 flex items-center gap-0.5 text-[clamp(0.75rem,calc(0.3255vw_+_0.5417rem),1.0625rem)] font-medium"
                  [class]="deltaColorClass()"
                >
                  <ng-icon [name]="deltaIconName()" size="10" />
                  {{ delta()! > 0 ? '+' : '' }}{{ delta() }}{{ deltaUnit() }}
                </div>
                <span
                  class="text-muted-foreground block truncate text-[clamp(0.75rem,calc(0.3255vw_+_0.5417rem),1.0625rem)]"
                  >{{ deltaLabel() }}</span
                >
              } @else if (caption()) {
                <span
                  class="text-muted-foreground mt-1 block truncate text-[clamp(0.75rem,calc(0.3255vw_+_0.5417rem),1.0625rem)]"
                  >{{ caption() }}</span
                >
              }
            }
          </div>
        </div>
      } @else {
        <div
          hlmCardContent
          class="flex min-h-0 flex-1 items-start gap-2 px-[clamp(0.875rem,calc(0.3906vw_+_0.625rem),1.25rem)]"
        >
          @if (ngIcon()) {
            <span
              class="flex h-[clamp(1.75rem,calc(1.3021vw_+_0.9167rem),3.0rem)] w-[clamp(1.75rem,calc(1.3021vw_+_0.9167rem),3.0rem)] shrink-0 items-center justify-center rounded-full text-[clamp(1rem,calc(0.5208vw_+_0.6667rem),1.5rem)]"
              [class]="iconToneClasses()"
            >
              <ng-icon [name]="ngIcon()!" size="1em" />
            </span>
          } @else if (icon()) {
            <span
              class="flex h-[clamp(1.75rem,calc(1.3021vw_+_0.9167rem),3.0rem)] w-[clamp(1.75rem,calc(1.3021vw_+_0.9167rem),3.0rem)] shrink-0 items-center justify-center rounded-full text-base"
              [class]="iconToneClasses()"
              >{{ icon() }}</span
            >
          }

          <div class="flex min-h-0 min-w-0 flex-1 flex-col">
            <span
              class="text-foreground mt-1 min-w-0 truncate text-[clamp(0.6875rem,calc(0.3255vw_+_0.4792rem),1.0rem)] leading-tight font-medium"
              >{{ label() }}</span
            >

            @if (loading()) {
              <div class="mt-2 h-9 w-20"><dt-skeleton /></div>
            } @else {
              <div class="mt-1 flex flex-wrap items-baseline gap-x-1.5">
                <span
                  class="font-light text-[clamp(1.5rem,calc(1.3021vw_+_0.6667rem),2.75rem)] tracking-tight"
                  >{{ value() }}</span
                >
                @if (unit()) {
                  <span
                    class="text-muted-foreground text-[clamp(0.75rem,calc(0.3906vw_+_0.5rem),1.125rem)] font-medium"
                    >{{ unit() }}</span
                  >
                }
                @if (delta() !== null) {
                  <span
                    class="flex self-center items-center gap-0.5 text-[clamp(0.75rem,calc(0.3255vw_+_0.5417rem),1.0625rem)] font-medium"
                    [class]="deltaColorClass()"
                  >
                    <ng-icon [name]="deltaIconName()" size="10" />
                    {{ delta()! > 0 ? '+' : '' }}{{ delta() }}{{ deltaUnit() }}
                  </span>
                }
              </div>
            }

            <div [class]="hasFillerContent() ? 'mt-auto w-full pt-1' : 'w-full'">
              @if (barSegments(); as segments) {
                <div class="bg-muted flex h-1.5 w-full overflow-hidden rounded-full">
                  @for (segment of segments; track $index) {
                    @if (segment.value > 0) {
                      <span [class]="segment.colorClass" [style.width.%]="segment.value"></span>
                    }
                  }
                </div>
              } @else if (spark(); as points) {
                @if (points.length > 0) {
                  <div
                    class="flex h-[clamp(1.0rem,calc(1.0417vw_+_0.3333rem),2.0rem)] items-end gap-[2px]"
                  >
                    @for (point of points; track $index) {
                      <span
                        class="bg-dashboard-accent/60 min-w-0 max-w-[4px] flex-1 rounded-full"
                        [style.height.%]="sparkHeight(point)"
                      ></span>
                    }
                  </div>
                }
              }

              @if (!loading()) {
                @if (delta() !== null) {
                  <span
                    class="text-muted-foreground block truncate text-[clamp(0.625rem,calc(0.2604vw_+_0.4583rem),0.8125rem)]"
                    >{{ deltaLabel() }}</span
                  >
                } @else if (caption()) {
                  <span
                    class="text-muted-foreground block truncate text-[clamp(0.625rem,calc(0.2604vw_+_0.4583rem),0.8125rem)]"
                    >{{ caption() }}</span
                  >
                }
                @if (statusLabel(); as label) {
                  <dt-status-chip
                    class="mt-1 inline-block"
                    [status]="label"
                    [toneOverride]="statusTone()"
                    [label]="label"
                  />
                }
              }
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class DtKpiCard {
  readonly label = input.required<string>();
  readonly value = input<string | number>('');
  readonly unit = input<string>();
  readonly icon = input<string>();
  readonly ngIcon = input<string>();
  readonly loading = input(false);
  readonly legacyLayout = input(false);
  readonly tone = input<'accent' | 'muted' | 'warning'>('accent');
  readonly caption = input<string>();
  readonly barSegments = input<KpiBarSegment[]>();
  readonly spark = input<number[]>();

  readonly delta = input<number | null>(null);
  readonly deltaLabel = input<string>('vs prior period');
  readonly deltaGood = input<'up' | 'down'>('up');
  readonly deltaUnit = input<string>('%');

  readonly statusLabel = input<string>();
  readonly statusTone = input<StatusTone>();

  protected readonly iconToneClasses = computed(() => {
    switch (this.tone()) {
      case 'muted':
        return 'bg-muted text-muted-foreground';
      case 'warning':
        return 'bg-amber-100 text-amber-700';
      default:
        return 'bg-dashboard-accent/10 text-dashboard-accent';
    }
  });

  protected readonly deltaColorClass = computed(() => {
    const d = this.delta();
    if (d === null || d === 0) return 'text-muted-foreground';
    const isGood = this.deltaGood() === 'up' ? d > 0 : d < 0;
    if (isGood) return 'text-dashboard-accent';
    return this.tone() === 'warning' ? 'text-amber-700' : 'text-dashboard-danger-strong';
  });

  protected readonly deltaIconName = computed(() => {
    const d = this.delta();
    return d === null || d === 0 ? 'lucideMinus' : d > 0 ? 'lucideArrowUp' : 'lucideArrowDown';
  });

  protected readonly hasFillerContent = computed(() => {
    const segments = this.barSegments();
    if (segments && segments.length > 0) return true;
    const points = this.spark();
    return !!points && points.length > 0;
  });

  private readonly sparkMax = computed(() => Math.max(1, ...(this.spark() ?? [0])));

  protected sparkHeight(value: number): number {
    return Math.max(6, Math.round((value / this.sparkMax()) * 100));
  }
}
