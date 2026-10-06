import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { ActivityEvent } from '../core/models';

@Injectable({ providedIn: 'root' })
export class ActivityStore {
  private readonly http = inject(HttpClient);

  private readonly _events = signal<ActivityEvent[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal(false);

  readonly events = this._events.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  readonly isEmpty = computed(
    () => !this._loading() && !this._error() && this._events().length === 0,
  );

  load(): void {
    this._loading.set(true);
    this._error.set(false);
    this.http.get<ActivityEvent[]>('/api/activity').subscribe({
      next: (events) => {
        this._events.set(events);
        this._loading.set(false);
      },
      error: () => {
        this._error.set(true);
        this._loading.set(false);
      },
    });
  }
}
