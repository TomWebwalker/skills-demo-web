import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Task, User } from '../core/models';
import { TaskBoard } from './task-board';

const users: User[] = [
  { id: 'u1', name: 'Ada' },
  { id: 'u2', name: 'Linus' },
];

const tasks: Task[] = [
  { id: 't1', title: 'Fix login', status: 'todo', assigneeId: 'u1' },
  { id: 't2', title: 'Add dark mode', status: 'in-progress', assigneeId: 'u2' },
  { id: 't3', title: 'Write docs', status: 'done', assigneeId: null },
];

describe('TaskBoard', () => {
  let fixture: ComponentFixture<TaskBoard>;
  let el: HTMLElement;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [TaskBoard],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    fixture = TestBed.createComponent(TaskBoard);
    el = fixture.nativeElement;
    await fixture.whenStable();

    const httpMock = TestBed.inject(HttpTestingController);
    httpMock.expectOne('/api/tasks').flush(tasks);
    httpMock.expectOne('/api/users').flush(users);
    await fixture.whenStable();
  });

  it('renders three columns with the seeded tasks', () => {
    const headings = [...el.querySelectorAll('.column h2')].map((h) => h.textContent?.trim());
    expect(headings).toEqual(['To do', 'In progress', 'Done']);

    const titlesIn = (status: string) =>
      [...el.querySelectorAll(`.column[data-status="${status}"] .title`)].map((t) =>
        t.textContent?.trim(),
      );
    expect(titlesIn('todo')).toEqual(['Fix login']);
    expect(titlesIn('in-progress')).toEqual(['Add dark mode']);
    expect(titlesIn('done')).toEqual(['Write docs']);
  });

  it('shows assignee names', () => {
    const names = [...el.querySelectorAll('.assignee-name')].map((n) => n.textContent?.trim());
    expect(names).toEqual(['Ada', 'Linus', 'Unassigned']);
  });
});
