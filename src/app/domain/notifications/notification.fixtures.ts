import type { AppNotification } from './notification.types';

const NOW = Date.now();
const hoursAgo = (h: number) => new Date(NOW - h * 60 * 60_000).toISOString();

export const NOTIFICATION_FIXTURES: AppNotification[] = [
  {
    id: 'n1',
    type: 'maintenance',
    title: 'Urgent: Water leak near mechanical room',
    message: 'Riverside Center — auto-created from device alert.',
    createdAt: hoursAgo(1),
    read: false,
    link: { route: ['/operations/maintenance', 'm3'] },
  },
  {
    id: 'n2',
    type: 'device',
    title: 'Device offline',
    message: 'Meeting Room Switch has been offline for 12 hours.',
    createdAt: hoursAgo(3),
    read: false,
    link: { route: ['/devices', 'd12'] },
  },
  {
    id: 'n3',
    type: 'maintenance',
    title: 'Request assigned',
    message: 'Flickering lights in Meeting Room assigned to Marcus Reed.',
    createdAt: hoursAgo(20),
    read: true,
    link: { route: ['/operations/maintenance', 'm2'] },
  },
  {
    id: 'n4',
    type: 'system',
    title: 'Weekly summary ready',
    message: 'Your portfolio analytics summary for last week is ready.',
    createdAt: hoursAgo(28),
    read: true,
    link: { route: ['/analytics'] },
  },
  {
    id: 'n5',
    type: 'access',
    title: 'New user invited',
    message: 'Sam Okafor was invited as a Building Manager.',
    createdAt: hoursAgo(50),
    read: true,
    link: { route: ['/access/users'] },
  },
  {
    id: 'n6',
    type: 'device',
    title: 'Smoke detector battery low',
    message: 'Mechanical Room Smoke Detector battery at 18%.',
    createdAt: hoursAgo(45),
    read: false,
    link: { route: ['/devices', 'd9'] },
  },
];
