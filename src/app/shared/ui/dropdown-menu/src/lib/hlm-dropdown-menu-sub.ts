import { CdkMenu } from '@angular/cdk/menu';
import { Directive, ElementRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  deriveMenuSideFromTransformOrigin,
  MENU_SIDE,
  type MenuSide,
} from '@spartan-ng/brain/core';
import { classes } from '@spartan-ng/helm/utils';

@Directive({
  selector: '[hlmDropdownMenuSub],hlm-dropdown-menu-sub',
  hostDirectives: [CdkMenu],
  host: {
    'data-slot': 'dropdown-menu-sub',
    '[attr.data-state]': '_state()',
    '[attr.data-side]': '_side()',
  },
})
export class HlmDropdownMenuSub {
  private readonly _host = inject(CdkMenu);
  private readonly _elementRef = inject(ElementRef<HTMLElement>);
  private readonly _menuSide = inject(MENU_SIDE, { optional: true });

  protected readonly _state = signal('open');
  protected readonly _side = signal<MenuSide>(this._menuSide?.side() ?? 'right');

  constructor() {
    this.setSideFromTransformOrigin();
    this._host.closed.pipe(takeUntilDestroyed()).subscribe(() => this._state.set('closed'));

    classes(
      () =>
        'motion-safe:data-open:animate-in motion-safe:data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-95 data-open:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 ring-foreground/10 bg-popover text-popover-foreground min-w-[96px] rounded-md p-1 shadow-lg ring-1 duration-100 w-auto',
    );
  }

  private setSideFromTransformOrigin() {
    const side = this._menuSide?.side() ?? 'right';
    setTimeout(() => {
      this._side.set(
        deriveMenuSideFromTransformOrigin(
          this._elementRef.nativeElement.style.transformOrigin,
          side,
        ),
      );
    });
  }
}
