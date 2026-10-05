import type { ContactEvent } from './contact-event.types';

const NOW = Date.now();
const minutesAgo = (m: number) => new Date(NOW - m * 60_000).toISOString();

const CONTACT_EVENT_FIXTURES: Record<string, ContactEvent[]> = {
  d45: [
    { id: 'd45-e1', state: 'open', at: minutesAgo(2) },
    { id: 'd45-e2', state: 'closed', at: minutesAgo(3) },
    { id: 'd45-e3', state: 'open', at: minutesAgo(23) },
    { id: 'd45-e4', state: 'closed', at: minutesAgo(24) },
    { id: 'd45-e5', state: 'open', at: minutesAgo(61) },
    { id: 'd45-e6', state: 'closed', at: minutesAgo(62) },
  ],
  d8: [
    { id: 'd8-e1', state: 'open', at: minutesAgo(15) },
    { id: 'd8-e2', state: 'closed', at: minutesAgo(16) },
    { id: 'd8-e3', state: 'open', at: minutesAgo(95) },
    { id: 'd8-e4', state: 'closed', at: minutesAgo(97) },
  ],
};

function fallbackContactEvents(deviceId: string): ContactEvent[] {
  return [
    { id: `${deviceId}-e1`, state: 'open', at: minutesAgo(5) },
    { id: `${deviceId}-e2`, state: 'closed', at: minutesAgo(6) },
    { id: `${deviceId}-e3`, state: 'open', at: minutesAgo(65) },
    { id: `${deviceId}-e4`, state: 'closed', at: minutesAgo(66) },
  ];
}

export function contactEventsFor(deviceId: string): ContactEvent[] {
  return CONTACT_EVENT_FIXTURES[deviceId] ?? fallbackContactEvents(deviceId);
}
