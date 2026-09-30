import { Component } from '@angular/core';
import { ActivityFeed } from './activity/activity-feed';
import { TaskBoard } from './tasks/task-board';

@Component({
  selector: 'app-root',
  imports: [TaskBoard, ActivityFeed],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {}
