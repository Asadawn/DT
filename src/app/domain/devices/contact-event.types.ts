export interface ContactEvent {
  id: string;
  state: 'open' | 'closed';
  at: string;
}
