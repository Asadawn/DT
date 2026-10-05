import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import { FormField, form, email, required, submit } from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCamera, lucideChevronLeft, lucideX } from '@ng-icons/lucide';
import { BuildingService } from '../../domain/buildings/building.service';
import { RoleService } from '../../domain/access/role.service';
import { UserService } from '../../domain/access/user.service';
import type { UserStatus } from '../../domain/access/access.types';
import type { SelectOption } from '../../shared/types/canonical.types';
import { HlmAvatarImports } from '@spartan-ng/helm/avatar';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmCheckboxImports } from '@spartan-ng/helm/checkbox';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmSelectImports } from '@spartan-ng/helm/select';
import { selectOptionLabelFn } from '../../shared/utils/select-option-label';
import { statusLabel } from '../../shared/utils/status-tone';
import { resizeImageToSquareDataUrl } from '../../shared/utils/resize-image-to-square';

interface UserFormModel {
  name: string;
  email: string;
  roleId: string;
  status: UserStatus;
}

const STATUS_OPTIONS: SelectOption[] = ['active', 'invited', 'disabled'].map((s) => ({
  value: s,
  label: statusLabel(s),
}));

const AVATAR_SIZE_PX = 256;

@Component({
  selector: 'app-user-form-page',
  imports: [
    FormField,
    RouterLink,
    NgIcon,
    ...HlmAvatarImports,
    ...HlmButtonImports,
    ...HlmCardImports,
    ...HlmSelectImports,
    ...HlmCheckboxImports,
    ...HlmInputImports,
  ],
  providers: [provideIcons({ lucideChevronLeft, lucideCamera, lucideX })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './user-form-page.html',
})
export class UserFormPage {
  readonly userId = input<string>();

  private readonly userService = inject(UserService);
  private readonly roleService = inject(RoleService);
  private readonly buildingService = inject(BuildingService);
  private readonly router = inject(Router);

  protected readonly roleOptions = computed<SelectOption[]>(() =>
    this.roleService.roles().map((r) => ({ value: r.id, label: r.name })),
  );
  protected readonly roleLabel = selectOptionLabelFn(this.roleOptions);
  protected readonly statusOptions = STATUS_OPTIONS;
  protected readonly statusOptionLabel = selectOptionLabelFn(() => this.statusOptions);
  protected readonly buildingOptions = computed<SelectOption[]>(() =>
    this.buildingService.buildings().map((b) => ({ value: b.id, label: b.name })),
  );

  protected readonly buildingScope = signal<string[]>([]);
  protected readonly avatarUrl = signal<string | null>(null);

  protected readonly model = signal<UserFormModel>({
    name: '',
    email: '',
    roleId: '',
    status: 'invited',
  });

  protected readonly userForm = form(this.model, (p) => {
    required(p.name, { message: 'Name is required' });
    required(p.email, { message: 'Email is required' });
    email(p.email, { message: 'Enter a valid email' });
    required(p.roleId, { message: 'Select a role' });
  });

  protected readonly submitting = signal(false);
  protected readonly submitAttempted = signal(false);

  private readonly hydrated = signal(false);

  constructor() {
    effect(() => {
      if (this.hydrated() || !this.userId()) return;
      const existing = this.userService.user(this.userId());
      if (!existing) return;
      untracked(() => {
        this.model.set({
          name: existing.name,
          email: existing.email,
          roleId: existing.roleId,
          status: existing.status,
        });
        this.buildingScope.set([...existing.buildingScope]);
        this.avatarUrl.set(existing.avatarUrl ?? null);
        this.hydrated.set(true);
      });
    });
  }

  protected toggleBuilding(buildingId: string, checked: boolean): void {
    this.buildingScope.update((scope) =>
      checked ? [...scope, buildingId] : scope.filter((id) => id !== buildingId),
    );
  }

  protected initials(): string {
    const name = this.model().name.trim();
    return (
      name
        .split(' ')
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase() || 'U'
    );
  }

  protected async onAvatarFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file || !file.type.startsWith('image/')) return;

    const dataUrl = await resizeImageToSquareDataUrl(file, AVATAR_SIZE_PX);
    this.avatarUrl.set(dataUrl);
  }

  protected removePhoto(): void {
    this.avatarUrl.set(null);
  }

  protected async onSubmit(): Promise<void> {
    this.submitAttempted.set(true);
    this.submitting.set(true);
    try {
      await submit(this.userForm, async () => {
        const value = this.model();
        await this.userService.save(this.userId() ?? null, {
          name: value.name,
          email: value.email,
          roleId: value.roleId,
          status: value.status,
          buildingScope: this.buildingScope(),
          avatarUrl: this.avatarUrl() ?? undefined,
        });
        await this.router.navigate(['/access/users']);
      });
    } finally {
      this.submitting.set(false);
    }
  }
}
