export interface MotionEvent {
  id: string;
  state: 'detected' | 'clear';
  at: string;
}
