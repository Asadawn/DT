import { Injectable, resource } from '@angular/core';
import { simulateLatency } from '../../shared/utils/simulate-latency';
import { NOTIFICATION_PREFERENCES_FIXTURE } from './notification-preferences.fixtures';
import type { NotificationPreferences } from './notification-preferences.types';
import type { NotificationType } from './notification.types';

@Injectable({ providedIn: 'root' })
export class NotificationPreferencesService {
  private readonly preferencesResource = resource({
    defaultValue: NOTIFICATION_PREFERENCES_FIXTURE,
    loader: async () => {
      await simulateLatency(200);
      return NOTIFICATION_PREFERENCES_FIXTURE;
    },
  });

  readonly preferences = this.preferencesResource.value;

  isEnabled(type: NotificationType): boolean {
    return this.preferences().enabledTypes.includes(type);
  }

  async setEnabled(type: NotificationType, enabled: boolean): Promise<void> {
    await simulateLatency(250);
    this.preferencesResource.update((current) => ({
      enabledTypes: enabled
        ? current.enabledTypes.includes(type)
          ? current.enabledTypes
          : [...current.enabledTypes, type]
        : current.enabledTypes.filter((t) => t !== type),
      updatedAt: new Date().toISOString(),
    }));
  }
}
