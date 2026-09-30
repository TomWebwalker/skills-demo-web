import { Component, computed, effect, inject, untracked } from '@angular/core';
import { ActivityEvent } from '../core/models';
import { TaskStore } from '../tasks/task-store';
import { ActivityStore } from './activity-store';

@Component({
  selector: 'app-activity-feed',
  template: `
    @if (store.error()) {
      <p class="error" role="alert">Could not load activity</p>
    } @else if (store.loading() && store.events().length === 0) {
      <p class="empty">Loading activity...</p>
    } @else if (store.isEmpty()) {
      <p class="empty">No activity yet</p>
    } @else {
      <ul>
        @for (line of lines(); track line.id) {
          <li>{{ line.text }}</li>
        }
      </ul>
    }
  `,
  styles: `
    .empty,
    .error {
      margin: 0;
      color: var(--text-muted);
      font-style: italic;
    }
    ul {
      max-height: calc(100vh - 12rem);
      overflow-y: auto;
      margin: 0;
      padding: 0;
      list-style: none;
    }
  `,
})
export class ActivityFeed {
  protected readonly store = inject(ActivityStore);
  private readonly taskStore = inject(TaskStore);

  protected readonly lines = computed(() =>
    this.store.events().map((event) => ({ id: event.id, text: this.describe(event) })),
  );

  constructor() {
    effect(() => {
      this.taskStore.moves();
      untracked(() => this.store.load());
    });
  }

  private userName(id: string | null): string {
    return this.taskStore.users().find((u) => u.id === id)?.name ?? 'Someone';
  }

  private describe(event: ActivityEvent): string {
    const actor = this.userName(event.actorId);
    const title = this.taskStore.tasks().find((t) => t.id === event.taskId)?.title ?? 'a task';
    switch (event.action) {
      case 'status-changed':
        return `${actor} moved "${title}" to ${event.to}`;
      case 'assigned':
        return `${actor} assigned "${title}" to ${event.to ? this.userName(event.to) : 'nobody'}`;
      case 'renamed':
        return `${actor} renamed "${event.from}" to "${event.to}"`;
    }
  }
}
