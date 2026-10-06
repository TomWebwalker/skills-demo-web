import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivityEvent } from '../core/models';
import { ActivityStore } from './activity-store';

const events: ActivityEvent[] = [
  {
    id: 'e1',
    taskId: 't1',
    actorId: 'u1',
    action: 'status-changed',
    from: 'todo',
    to: 'done',
    at: '2026-10-01T10:05:00.000Z',
  },
];

describe('ActivityStore', () => {
  let store: ActivityStore;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    store = TestBed.inject(ActivityStore);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('is not empty while loading', () => {
    store.load();
    expect(store.loading()).toBe(true);
    expect(store.isEmpty()).toBe(false);
    httpMock.expectOne('/api/activity').flush(events);
  });

  it('exposes events after load', () => {
    store.load();
    httpMock.expectOne('/api/activity').flush(events);
    expect(store.loading()).toBe(false);
    expect(store.events()).toEqual(events);
    expect(store.isEmpty()).toBe(false);
  });

  it('is empty after loading an empty log', () => {
    store.load();
    httpMock.expectOne('/api/activity').flush([]);
    expect(store.isEmpty()).toBe(true);
  });

  it('reports an error instead of empty on failure', () => {
    store.load();
    httpMock.expectOne('/api/activity').flush('boom', { status: 500, statusText: 'Server Error' });
    expect(store.loading()).toBe(false);
    expect(store.error()).toBe(true);
    expect(store.isEmpty()).toBe(false);
  });
});
