import { Directive, TemplateRef, ViewContainerRef, effect, inject, input } from '@angular/core';
import {
  PermissionService,
  type PermissionAction,
} from '../../core/permissions/permission.service';

@Directive({ selector: '[hasPermission]' })
export class HasPermission {
  private readonly templateRef = inject(TemplateRef);
  private readonly viewContainerRef = inject(ViewContainerRef);
  private readonly permissionService = inject(PermissionService);

  readonly resource = input.required<string>({ alias: 'hasPermission' });
  readonly action = input.required<PermissionAction>({ alias: 'hasPermissionAction' });

  private hasView = false;

  constructor() {
    effect(() => {
      const granted = this.permissionService.hasPermission(this.resource(), this.action());
      if (granted && !this.hasView) {
        this.viewContainerRef.createEmbeddedView(this.templateRef);
        this.hasView = true;
      } else if (!granted && this.hasView) {
        this.viewContainerRef.clear();
        this.hasView = false;
      }
    });
  }
}
