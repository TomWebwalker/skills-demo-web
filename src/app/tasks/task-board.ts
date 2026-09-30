import { Component, inject, OnInit } from '@angular/core';
import { Task } from '../core/models';
import { TaskStatus, TaskStore } from './task-store';

interface Column {
  status: TaskStatus;
  label: string;
}

@Component({
  selector: 'app-task-board',
  templateUrl: './task-board.html',
  styleUrl: './task-board.css',
})
export class TaskBoard implements OnInit {
  protected readonly store = inject(TaskStore);

  protected readonly columns: Column[] = [
    { status: 'todo', label: 'To do' },
    { status: 'in-progress', label: 'In progress' },
    { status: 'done', label: 'Done' },
  ];

  ngOnInit(): void {
    this.store.load();
  }

  protected assigneeName(task: Task): string {
    if (!task.assigneeId) return 'Unassigned';
    return this.store.users().find((u) => u.id === task.assigneeId)?.name ?? 'Unassigned';
  }

  protected otherColumns(status: TaskStatus): Column[] {
    return this.columns.filter((c) => c.status !== status);
  }

  protected move(task: Task, status: TaskStatus): void {
    this.store.updateStatus(task.id, status);
  }
}
