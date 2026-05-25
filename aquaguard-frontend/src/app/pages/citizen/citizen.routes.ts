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
];
