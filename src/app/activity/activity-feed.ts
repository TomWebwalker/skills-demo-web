import { Component } from '@angular/core';

// Placeholder — the real activity feed is issue #42.
@Component({
  selector: 'app-activity-feed',
  template: `<p class="placeholder">Activity feed coming soon.</p>`,
  styles: `
    .placeholder {
      margin: 0;
      color: var(--text-muted);
      font-style: italic;
    }
  `,
})
export class ActivityFeed {}
