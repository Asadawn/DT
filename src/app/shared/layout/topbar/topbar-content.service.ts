import { Injectable, TemplateRef, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class TopbarContentService {
  readonly content = signal<TemplateRef<unknown> | null>(null);

  set(ref: TemplateRef<unknown>): void {
    this.content.set(ref);
  }

  clear(ref: TemplateRef<unknown>): void {
    if (this.content() === ref) this.content.set(null);
  }
}
