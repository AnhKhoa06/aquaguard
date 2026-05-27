import { Routes } from '@angular/router';

export const responderRoutes: Routes = [
  { path: '', redirectTo: 'map', pathMatch: 'full' as const },
  {
    path: 'map',
    loadComponent: () => import('./map/map').then((m) => m.MapComponent),
  },
  {
    path: 'tasks',
    loadComponent: () => import('./tasks/tasks').then((m) => m.TasksComponent),
  },
  {
    path: 'my-tasks',
    loadComponent: () => import('./my-tasks/my-tasks').then((m) => m.MyTasksComponent),
  },
  {
    path: 'team',
    loadComponent: () => import('./team/team').then((m) => m.TeamComponent),
  },
];
