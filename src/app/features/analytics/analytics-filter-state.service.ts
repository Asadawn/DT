import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AnalyticsFilterStateService {
  readonly buildingId = signal('');
  readonly floorId = signal('');
  readonly spaceId = signal('');
}
