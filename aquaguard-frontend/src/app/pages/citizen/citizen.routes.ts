import { Routes } from '@angular/router';

export const citizenRoutes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/dashboard').then((m) => m.DashboardComponent),
  },
  {
    path: 'map',
    loadComponent: () => import('./map/map').then((m) => m.MapComponent),
  },
  {
    path: 'sos',
    loadComponent: () => import('./sos/sos').then((m) => m.SosComponent),
  },
  {
    path: 'safety',
    loadComponent: () => import('./safety/safety').then((m) => m.SafetyComponent),
  },
];
