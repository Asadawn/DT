import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormField, form, minLength, required, submit, validate } from '@angular/forms/signals';
import { Router } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideBell, lucideCamera, lucideLock, lucideUserCircle, lucideX } from '@ng-icons/lucide';
import { AuthService } from '../../core/auth/auth.service';
import { RoleService } from '../../domain/access/role.service';
import { NotificationPreferencesService } from '../../domain/notifications/notification-preferences.service';
import type { NotificationType } from '../../domain/notifications/notification.types';
import { resizeImageToSquareDataUrl } from '../../shared/utils/resize-image-to-square';
import { HlmAvatarImports } from '@spartan-ng/helm/avatar';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmSwitchImports } from '@spartan-ng/helm/switch';
import { PageHeader } from '../../shared/ui/page-header/page-header';

interface NotificationTypeOption {
  type: NotificationType;
  label: string;
  description: string;
}

const NOTIFICATION_TYPE_OPTIONS: NotificationTypeOption[] = [
  {
    type: 'maintenance',
    label: 'Maintenance',
    description: 'Request status changes, assignments and vendor updates.',
  },
  {
    type: 'device',
    label: 'Devices',
    description: 'Connectivity loss, command failures and low-battery alerts.',
  },
  {
    type: 'automation',
    label: 'Automations',
    description: 'Execution results, including partial and failed runs.',
  },
  {
    type: 'access',
    label: 'Access',
    description: 'Temporary access grants, expirations and revocations.',
  },
  {
    type: 'system',
    label: 'System',
    description: 'Platform-level notices not tied to a specific record.',
  },
];

const AVATAR_SIZE_PX = 256;

@Component({
  selector: 'app-settings-page',
  imports: [
    PageHeader,
    FormField,
    NgIcon,
    ...HlmCardImports,
    ...HlmAvatarImports,
    ...HlmButtonImports,
    ...HlmInputImports,
    ...HlmSwitchImports,
  ],
  providers: [provideIcons({ lucideUserCircle, lucideLock, lucideBell, lucideCamera, lucideX })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './settings-page.html',
})
export class SettingsPage {
  private readonly authService = inject(AuthService);
  private readonly roleService = inject(RoleService);
  private readonly notificationPreferencesService = inject(NotificationPreferencesService);
  private readonly router = inject(Router);

  protected readonly currentUser = this.authService.currentUser;
  protected readonly role = computed(() => this.roleService.role(this.currentUser()?.roleId));

  protected readonly notificationTypeOptions = NOTIFICATION_TYPE_OPTIONS;

  protected readonly editingProfile = signal(false);
  protected readonly savingProfile = signal(false);
  protected readonly profileModel = signal({ displayName: '' });
  protected readonly profileForm = form(this.profileModel, (p) => {
    required(p.displayName, { message: 'Name is required' });
  });

  private readonly stagedAvatarUrl = signal<string | null | undefined>(undefined);

  protected readonly avatarPreview = computed(() => {
    if (this.editingProfile() && this.stagedAvatarUrl() !== undefined)
      return this.stagedAvatarUrl();
    return this.currentUser()?.avatarUrl ?? null;
  });

  protected startEditProfile(): void {
    const user = this.currentUser();
    if (!user) return;
    this.profileModel.set({ displayName: user.displayName });
    this.stagedAvatarUrl.set(undefined);
    this.editingProfile.set(true);
  }

  protected cancelEditProfile(): void {
    this.stagedAvatarUrl.set(undefined);
    this.editingProfile.set(false);
  }

  protected async onAvatarFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file || !file.type.startsWith('image/')) return;

    const dataUrl = await resizeImageToSquareDataUrl(file, AVATAR_SIZE_PX);
    this.stagedAvatarUrl.set(dataUrl);
  }

  protected removePhoto(): void {
    this.stagedAvatarUrl.set(null);
  }

  protected async saveProfile(): Promise<void> {
    this.savingProfile.set(true);
    try {
      await submit(this.profileForm, async () => {
        const staged = this.stagedAvatarUrl();
        await this.authService.updateProfile({
          displayName: this.profileModel().displayName.trim(),
          ...(staged !== undefined ? { avatarUrl: staged ?? undefined } : {}),
        });
        this.stagedAvatarUrl.set(undefined);
        this.editingProfile.set(false);
      });
    } finally {
      this.savingProfile.set(false);
    }
  }

  protected readonly changingPassword = signal(false);
  protected readonly passwordChanged = signal(false);
  protected readonly passwordModel = signal({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  protected readonly passwordForm = form(this.passwordModel, (p) => {
    required(p.currentPassword, { message: 'Enter your current password' });
    required(p.newPassword, { message: 'New password is required' });
    minLength(p.newPassword, 8, { message: 'Must be at least 8 characters' });
    required(p.confirmPassword, { message: 'Confirm your new password' });
    validate(p.confirmPassword, (ctx) =>
      ctx.value() === ctx.valueOf(p.newPassword)
        ? undefined
        : { kind: 'mismatch', message: 'Passwords do not match' },
    );
  });

  protected async changePassword(): Promise<void> {
    this.changingPassword.set(true);
    this.passwordChanged.set(false);
    try {
      await submit(this.passwordForm, async () => {
        const value = this.passwordModel();
        await this.authService.changePassword(value.currentPassword, value.newPassword);
        this.passwordModel.set({ currentPassword: '', newPassword: '', confirmPassword: '' });
        this.passwordChanged.set(true);
      });
    } finally {
      this.changingPassword.set(false);
    }
  }

  protected initials(): string {
    const name = this.currentUser()?.displayName ?? '';
    return (
      name
        .split(' ')
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase() || 'DT'
    );
  }

  protected isNotificationTypeEnabled(type: NotificationType): boolean {
    return this.notificationPreferencesService.isEnabled(type);
  }

  protected setNotificationTypeEnabled(type: NotificationType, enabled: boolean): void {
    void this.notificationPreferencesService.setEnabled(type, enabled);
  }

  protected async signOut(): Promise<void> {
    this.authService.signOut();
    await this.router.navigateByUrl('/auth/sign-in');
  }
}
