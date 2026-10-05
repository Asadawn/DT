import { NgTemplateOutlet } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ContentChildren,
  DestroyRef,
  ElementRef,
  QueryList,
  computed,
  inject,
  input,
  linkedSignal,
  model,
  output,
  signal,
} from '@angular/core';
import { DtCellTemplate } from './cell-template.directive';
import type { DtTableColumn } from './data-table.types';
import { DtEmptyState } from '../state/empty-state';
import { DtErrorState } from '../state/error-state';
import { DtSkeleton } from '../state/skeleton';
import { HlmCheckboxImports } from '@spartan-ng/helm/checkbox';
import { HlmNumberedPagination } from '@spartan-ng/helm/pagination';

@Component({
  selector: 'dt-data-table',
  imports: [
    NgTemplateOutlet,
    DtSkeleton,
    DtEmptyState,
    DtErrorState,
    HlmNumberedPagination,
    ...HlmCheckboxImports,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  templateUrl: './data-table.html',
})
export class DtDataTable<T extends { id: string }> implements AfterViewInit {
  readonly columns = input.required<DtTableColumn<T>[]>();
  readonly rows = input.required<T[]>();
  readonly loading = input(false);
  readonly error = input(false);
  readonly emptyTitle = input('No results');
  readonly emptyDescription = input<string>();
  readonly pageSizeInput = input(10, { alias: 'pageSize' });
  readonly selectable = input(false);
  readonly selected = model<ReadonlySet<string>>(new Set());

  readonly rowClick = output<T>();
  readonly retry = output<void>();

  @ContentChildren(DtCellTemplate) private cellTemplateList?: QueryList<DtCellTemplate<T>>;

  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly containerWidth = signal(1024);

  protected readonly isCardMode = computed(() => this.containerWidth() < 560);
  protected readonly visibleColumns = computed(() => {
    const width = this.containerWidth();
    return this.columns().filter((c) => {
      if (c.priority === 1) return true;
      if (c.priority === 2) return width >= 560;
      return width >= 900;
    });
  });

  private readonly sortState = signal<{ columnId: string; direction: 'asc' | 'desc' } | null>(null);
  protected readonly page = signal(1);
  protected readonly pageSize = linkedSignal(this.pageSizeInput);

  protected readonly sortedRows = computed(() => {
    const sort = this.sortState();
    const rows = this.rows();
    if (!sort) return rows;
    const column = this.columns().find((c) => c.id === sort.columnId);
    if (!column) return rows;

    const direction = sort.direction === 'asc' ? 1 : -1;
    return [...rows].sort((a, b) => {
      const av = column.accessor(a);
      const bv = column.accessor(b);
      if (av === bv) return 0;
      if (av === null) return 1;
      if (bv === null) return -1;
      return av > bv ? direction : -direction;
    });
  });

  protected readonly pagedRows = computed(() => {
    const start = (this.page() - 1) * this.pageSize();
    return this.sortedRows().slice(start, start + this.pageSize());
  });

  protected readonly pageAllSelected = computed(() => {
    const rows = this.pagedRows();
    return rows.length > 0 && rows.every((r) => this.selected().has(r.id));
  });

  protected readonly pageSomeSelected = computed(
    () => !this.pageAllSelected() && this.pagedRows().some((r) => this.selected().has(r.id)),
  );

  protected isSelected(id: string): boolean {
    return this.selected().has(id);
  }

  protected toggleRow(id: string): void {
    const next = new Set(this.selected());
    if (next.has(id)) next.delete(id);
    else next.add(id);
    this.selected.set(next);
  }

  protected toggleAllOnPage(): void {
    const next = new Set(this.selected());
    if (this.pageAllSelected()) {
      for (const row of this.pagedRows()) next.delete(row.id);
    } else {
      for (const row of this.pagedRows()) next.add(row.id);
    }
    this.selected.set(next);
  }

  ngAfterViewInit(): void {
    const el = this.elementRef.nativeElement;
    this.containerWidth.set(el.clientWidth || 1024);

    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width;
      if (width) this.containerWidth.set(width);
    });
    observer.observe(el);
    this.destroyRef.onDestroy(() => observer.disconnect());
  }

  protected toggleSort(column: DtTableColumn<T>): void {
    if (!column.sortable) return;
    const current = this.sortState();
    if (current?.columnId !== column.id) {
      this.sortState.set({ columnId: column.id, direction: 'asc' });
    } else if (current.direction === 'asc') {
      this.sortState.set({ columnId: column.id, direction: 'desc' });
    } else {
      this.sortState.set(null);
    }
  }

  protected sortIndicator(columnId: string): string {
    const sort = this.sortState();
    if (sort?.columnId !== columnId) return '';
    return sort.direction === 'asc' ? '↑' : '↓';
  }

  protected templateFor(columnId: string): DtCellTemplate<T> | undefined {
    return this.cellTemplateList?.find((t) => t.dtCell() === columnId);
  }

  protected primaryColumn(): DtTableColumn<T> | undefined {
    return this.columns()[0];
  }

  protected secondaryColumns(): DtTableColumn<T>[] {
    return this.columns().slice(1);
  }
}
