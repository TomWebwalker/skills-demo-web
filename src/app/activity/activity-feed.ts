import { DatePipe } from '@angular/common';
import { Component, computed, inject, OnInit } from '@angular/core';
import { ActivityEvent } from '../core/models';
import { TaskStore } from '../tasks/task-store';
import { ActivityStore } from './activity-store';

@Component({
  selector: 'app-activity-feed',
  imports: [DatePipe],
  templateUrl: './activity-feed.html',
  styleUrl: './activity-feed.css',
})
export class ActivityFeed implements OnInit {
  protected readonly activityStore = inject(ActivityStore);
  private readonly taskStore = inject(TaskStore);

  protected readonly lines = computed(() => {
    const users = new Map(this.taskStore.users().map((u) => [u.id, u.name]));
    const tasks = new Map(this.taskStore.tasks().map((t) => [t.id, t.title]));
    return this.activityStore.events().map((event) => ({
      event,
      text: this.describe(event, users, tasks),
    }));
  });

  ngOnInit(): void {
    this.activityStore.load();
  }

  private describe(
    event: ActivityEvent,
    users: Map<string, string>,
    tasks: Map<string, string>,
  ): string {
    const actor = users.get(event.actorId) ?? 'Someone';
    const title = tasks.get(event.taskId);
    const task = title === undefined ? 'a task' : `"${title}"`;
    switch (event.action) {
      case 'status-changed':
        return `${actor} moved ${task} to ${event.to}`;
      case 'assigned':
        return `${actor} assigned ${task} to ${(event.to && users.get(event.to)) || 'someone'}`;
      case 'renamed':
        return `${actor} renamed "${event.from}" to "${event.to}"`;
    }
  }
}
