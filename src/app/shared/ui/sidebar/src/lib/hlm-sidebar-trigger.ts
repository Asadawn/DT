import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideChevronLeft, lucideChevronRight, lucidePanelLeft } from '@ng-icons/lucide';
import { HlmButton, provideBrnButtonConfig } from '@spartan-ng/helm/button';
import { HlmSidebarService } from './hlm-sidebar.service';

@Component({
  selector: 'button[hlmSidebarTrigger]',
  imports: [NgIcon],
  providers: [
    provideIcons({ lucidePanelLeft, lucideChevronLeft, lucideChevronRight }),
    provideBrnButtonConfig({ variant: 'ghost', size: 'icon-sm' }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [{ directive: HlmButton, inputs: ['variant', 'size'] }],
  host: {
    'data-slot': 'sidebar-trigger',
    'data-sidebar': 'trigger',
    '(click)': '_onClick()',
  },
  template: `
    <ng-icon [name]="icon()" />
    <span class="sr-only">{{ srOnlyText() }}</span>
  `,
})
export class HlmSidebarTrigger {
  private readonly _sidebarService = inject(HlmSidebarService);

  public readonly srOnlyText = input<string>('Toggle Sidebar');
  public readonly iconStyle = input<'panel' | 'chevron'>('panel');

  private readonly _isOpen = computed(() =>
    this._sidebarService.isMobile()
      ? this._sidebarService.openMobile()
      : this._sidebarService.state() === 'expanded',
  );

  protected readonly icon = computed(() => {
    if (this.iconStyle() === 'panel') return 'lucidePanelLeft';
    return this._isOpen() ? 'lucideChevronLeft' : 'lucideChevronRight';
  });

  protected _onClick(): void {
    this._sidebarService.toggleSidebar();
  }
}
