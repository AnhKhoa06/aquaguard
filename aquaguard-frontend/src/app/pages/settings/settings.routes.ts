import { Routes } from '@angular/router';

export const settingsRoutes: Routes = [
  { path: '', loadComponent: () => import('./settings').then((m) => m.SettingsComponent) },
];
