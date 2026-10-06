import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Task, User } from '../core/models';
import { TaskStore } from './task-store';

const users: User[] = [
  { id: 'u1', name: 'Ada' },
  { id: 'u2', name: 'Linus' },
];

const tasks: Task[] = [
  { id: 't1', title: 'Fix login', status: 'todo', assigneeId: 'u1' },
  { id: 't2', title: 'Write docs', status: 'done', assigneeId: null },
];

describe('TaskStore', () => {
  let store: TaskStore;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    store = TestBed.inject(TaskStore);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('loads tasks and users', () => {
    store.load();
    expect(store.loading()).toBe(true);

    httpMock.expectOne('/api/tasks').flush(tasks);
    httpMock.expectOne('/api/users').flush(users);

    expect(store.loading()).toBe(false);
    expect(store.tasks()).toEqual(tasks);
    expect(store.users()).toEqual(users);
    expect(store.byStatus().todo.map((t) => t.id)).toEqual(['t1']);
    expect(store.byStatus().done.map((t) => t.id)).toEqual(['t2']);
  });

  it('updateStatus sends the PATCH and updates state', () => {
    store.load();
    httpMock.expectOne('/api/tasks').flush(tasks);
    httpMock.expectOne('/api/users').flush(users);

    store.updateStatus('t1', 'in-progress');

    const req = httpMock.expectOne('/api/tasks/t1');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ status: 'in-progress', actorId: 'u1' });
    req.flush({ ...tasks[0], status: 'in-progress' });
    httpMock.expectOne('/api/activity').flush([]);

    expect(store.tasks().find((t) => t.id === 't1')?.status).toBe('in-progress');
    expect(store.byStatus()['in-progress'].map((t) => t.id)).toEqual(['t1']);
    expect(store.byStatus().todo).toEqual([]);
  });

  it('exposes an error when loading fails', () => {
    store.load();
    httpMock.match('/api/tasks').forEach((r) => r.flush('boom', { status: 500, statusText: 'Err' }));

    expect(store.error()).toBe(true);
    expect(store.loading()).toBe(false);

    store.load();
    expect(store.error()).toBe(false);
    httpMock.expectOne('/api/tasks').flush(tasks);
    httpMock.match('/api/users').at(-1)?.flush(users);
    expect(store.tasks()).toEqual(tasks);
  });

  it('reloads activity after a successful updateStatus', () => {
    store.updateStatus('t1', 'done');
    httpMock.expectNone('/api/activity');

    httpMock.expectOne('/api/tasks/t1').flush({ ...tasks[0], status: 'done' });

    const activityReq = httpMock.expectOne('/api/activity');
    expect(activityReq.request.method).toBe('GET');
    activityReq.flush([]);
  });
});
