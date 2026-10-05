import { InputModalityDetector } from '@angular/cdk/a11y';
import { CdkMenu, CdkMenuItem } from '@angular/cdk/menu';
import { Directive, inject } from '@angular/core';

@Directive({
  selector: '[hlmDropdownMenuFocusOnHover]',
  host: {
    '(mouseenter)': '_focusOnHover()',
  },
})
export class HlmDropdownMenuFocusOnHover {
  private readonly _cdkMenuItem = inject(CdkMenuItem, { self: true });
  private readonly _parentMenu = inject(CdkMenu, { optional: true });
  private readonly _inputModality = inject(InputModalityDetector);

  protected _focusOnHover(): void {
    if (this._inputModality.mostRecentModality === 'touch' || this._cdkMenuItem.disabled) {
      return;
    }
    this._parentMenu?.setActiveMenuItem(this._cdkMenuItem);
  }
}
