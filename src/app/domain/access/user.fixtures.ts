import type { AppUser } from './access.types';

export const USER_FIXTURES: AppUser[] = [
  { id: 'u1', name: 'Dana Whitfield', email: 'dana@digitaltwin.example', roleId: 'r1', buildingScope: [], status: 'active' },
  { id: 'u2', name: 'Marcus Reed', email: 'marcus@digitaltwin.example', roleId: 'r3', buildingScope: ['b1'], status: 'active' },
  { id: 'u3', name: 'Priya Anand', email: 'priya@digitaltwin.example', roleId: 'r2', buildingScope: ['b1', 'b2'], status: 'active' },
  { id: 'u4', name: 'Ken Ito', email: 'ken@digitaltwin.example', roleId: 'r3', buildingScope: ['b3'], status: 'active' },
  { id: 'u5', name: 'Sam Okafor', email: 'sam@digitaltwin.example', roleId: 'r2', buildingScope: ['b2'], status: 'invited' },
  { id: 'u6', name: 'Jordan Blake', email: 'jordan@digitaltwin.example', roleId: 'r4', buildingScope: [], status: 'disabled' },
];
