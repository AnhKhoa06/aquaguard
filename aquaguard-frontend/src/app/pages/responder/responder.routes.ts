import { Routes } from '@angular/router';

export const responderRoutes: Routes = [
  { path: '', redirectTo: 'tasks', pathMatch: 'full' },
  {
    path: 'tasks',
    loadComponent: () => import('./tasks/tasks').then((m) => m.TasksComponent),
  },
];
