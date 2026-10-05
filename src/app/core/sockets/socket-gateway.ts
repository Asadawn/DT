import { Injectable, signal } from '@angular/core';
import { Observable } from 'rxjs';

export type SocketConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

@Injectable({ providedIn: 'root' })
export class SocketGateway {
  private readonly connectionStateSignal = signal<SocketConnectionState>('disconnected');
  readonly connectionState = this.connectionStateSignal.asReadonly();

  deviceUpdates<T>(deviceId: string): Observable<T> {
    return new Observable<T>(() => {
      return () => {};
    });
  }
}
