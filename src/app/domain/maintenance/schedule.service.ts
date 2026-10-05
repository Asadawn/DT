import { Injectable, resource } from '@angular/core';
import { simulateLatency } from '../../shared/utils/simulate-latency';
import { SCHEDULE_FIXTURES } from './schedule.fixtures';
import type { NewScheduleInput, Schedule } from './schedule.types';

@Injectable({ providedIn: 'root' })
export class ScheduleService {
  private readonly schedulesResource = resource({
    defaultValue: [] as Schedule[],
    loader: async () => {
      await simulateLatency();
      return SCHEDULE_FIXTURES;
    },
  });

  readonly schedules = this.schedulesResource.value;
  readonly schedulesLoading = this.schedulesResource.isLoading;

  schedule(id: string | null | undefined): Schedule | undefined {
    if (!id) return undefined;
    return this.schedules().find((s) => s.id === id);
  }

  schedulesForDevice(deviceId: string): Schedule[] {
    return this.schedules().filter((s) => s.deviceIds.includes(deviceId));
  }

  async save(id: string | null, input: NewScheduleInput): Promise<Schedule> {
    await simulateLatency(400);
    if (id) {
      let updated: Schedule | undefined;
      this.schedulesResource.update((list) =>
        list.map((s) => {
          if (s.id !== id) return s;
          updated = { ...s, ...input };
          return updated;
        }),
      );
      return updated!;
    }
    const created: Schedule = { id: `sch${Date.now().toString(36)}`, status: 'active', ...input };
    this.schedulesResource.update((list) => [created, ...list]);
    return created;
  }
}
