import { Routes } from '@angular/router';

export const adminRoutes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/dashboard').then((m) => m.AdminDashboardComponent),
  },
  {
    path: 'sos',
    loadComponent: () => import('./sos/sos').then((m) => m.SosComponent),
  },
  {
    path: 'sensors',
    loadComponent: () => import('./sensors/sensors').then((m) => m.SensorsComponent),
  },
  {
    path: 'analytics',
    loadComponent: () => import('./analytics/analytics').then((m) => m.AnalyticsComponent),
  },
];
