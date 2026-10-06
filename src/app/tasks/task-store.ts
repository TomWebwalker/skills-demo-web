import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import { Task, User } from '../core/models';
import { ActivityStore } from '../activity/activity-store';

export type TaskStatus = Task['status'];

@Injectable({ providedIn: 'root' })
export class TaskStore {
  private readonly http = inject(HttpClient);
  private readonly activityStore = inject(ActivityStore);

  private readonly _tasks = signal<Task[]>([]);
  private readonly _users = signal<User[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal(false);

  readonly tasks = this._tasks.asReadonly();
  readonly users = this._users.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  readonly byStatus = computed(() => {
    const groups: Record<TaskStatus, Task[]> = { todo: [], 'in-progress': [], done: [] };
    for (const task of this._tasks()) {
      groups[task.status].push(task);
    }
    return groups;
  });

  load(): void {
    this._loading.set(true);
    this._error.set(false);
    forkJoin({
      tasks: this.http.get<Task[]>('/api/tasks'),
      users: this.http.get<User[]>('/api/users'),
    }).subscribe({
      next: ({ tasks, users }) => {
        this._tasks.set(tasks);
        this._users.set(users);
        this._loading.set(false);
      },
      error: () => {
        this._error.set(true);
        this._loading.set(false);
      },
    });
  }

  updateStatus(id: string, status: TaskStatus): void {
    this.http
      .patch<Task>(`/api/tasks/${id}`, { status, actorId: 'u1' })
      .subscribe((updated) => {
        this._tasks.update((tasks) => tasks.map((t) => (t.id === updated.id ? updated : t)));
        this.activityStore.load();
      });
  }
}
