import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivityEvent, Task, User } from '../core/models';
import { TaskStore } from '../tasks/task-store';
import { ActivityFeed } from './activity-feed';

// Issue #42 — written before the feature exists. These are the checker's definition of done.

const users: User[] = [
  { id: 'u1', name: 'Ada' },
  { id: 'u2', name: 'Linus' },
];

const tasks: Task[] = [
  { id: 't1', title: 'Fix login', status: 'done', assigneeId: 'u1' },
  { id: 't2', title: 'Add dark mode', status: 'in-progress', assigneeId: 'u2' },
];

const events: ActivityEvent[] = [
  {
    id: 'e2',
    taskId: 't1',
    actorId: 'u1',
    action: 'status-changed',
    from: 'in-progress',
    to: 'done',
    at: '2026-10-01T10:05:00.000Z',
  },
  {
    id: 'e1',
    taskId: 't2',
    actorId: 'u2',
    action: 'assigned',
    from: null,
    to: 'u2',
    at: '2026-10-01T10:00:00.000Z',
  },
];

describe('ActivityFeed', () => {
  let fixture: ComponentFixture<ActivityFeed>;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ActivityFeed],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    httpMock = TestBed.inject(HttpTestingController);
  });

  async function render(): Promise<void> {
    fixture = TestBed.createComponent(ActivityFeed);
    await fixture.whenStable();
  }

  /** Seeds users and tasks through TaskStore's own requests. */
  async function seedTaskStore(): Promise<void> {
    TestBed.inject(TaskStore).load();
    httpMock.match('/api/tasks').forEach((req) => req.flush(tasks));
    httpMock.match('/api/users').forEach((req) => req.flush(users));
    await fixture.whenStable();
  }

  it('requests GET /api/activity on init', async () => {
    await render();

    const req = httpMock.expectOne('/api/activity');
    expect(req.request.method).toBe('GET');
  });

  it('renders one list item per event, naming actor and task', async () => {
    await render();
    await seedTaskStore();

    httpMock.expectOne('/api/activity').flush(events);
    await fixture.whenStable();

    const items = [...(fixture.nativeElement as HTMLElement).querySelectorAll('li')];
    expect(items).toHaveLength(events.length);
    expect(items[0].textContent).toContain('Ada');
    expect(items[0].textContent).toContain('Fix login');
    expect(items[1].textContent).toContain('Linus');
    expect(items[1].textContent).toContain('Add dark mode');
  });

  it('renders "No activity yet" for an empty log', async () => {
    await render();

    httpMock.expectOne('/api/activity').flush([]);
    await fixture.whenStable();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('No activity yet');
  });
});
