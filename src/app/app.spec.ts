import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { App } from './app';

describe('App', () => {
  it('renders the board and the Activity panel', async () => {
    TestBed.configureTestingModule({
      imports: [App],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelector('h1')?.textContent).toContain('Sprint board');
    expect(el.querySelector('app-task-board')).toBeTruthy();

    const activity = el.querySelector('aside.activity');
    expect(activity?.querySelector('h2')?.textContent).toContain('Activity');
    expect(activity?.querySelector('app-activity-feed')).toBeTruthy();
  });
});
