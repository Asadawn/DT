import { Directive, TemplateRef, inject, input } from '@angular/core';

export interface DtCellContext<T> {
  $implicit: T;
}

@Directive({ selector: 'ng-template[dtCell]' })
export class DtCellTemplate<T = unknown> {
  readonly dtCell = input.required<string>();
  readonly templateRef = inject<TemplateRef<DtCellContext<T>>>(TemplateRef);
}
