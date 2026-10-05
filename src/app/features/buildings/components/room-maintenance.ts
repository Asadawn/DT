import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { MaintenanceRequest } from '../../../domain/maintenance/maintenance.types';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { DtStatusChip } from '../../../shared/ui/badge/status-chip';

@Component({
  selector: 'app-room-maintenance',
  imports: [RouterLink, DatePipe, DtStatusChip, ...HlmCardImports],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './room-maintenance.html',
})
export class RoomMaintenance {
  readonly requests = input.required<MaintenanceRequest[]>();
  readonly scopeLabel = input<string>('room');
}
