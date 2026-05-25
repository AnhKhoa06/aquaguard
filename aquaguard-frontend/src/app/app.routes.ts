import { Routes } from '@angular/router';
import { authGuard, roleGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // Redirect mặc định
  { path: '', redirectTo: '/auth/login', pathMatch: 'full' },

  // Auth routes
  {
    path: 'auth',
    loadChildren: () => import('./pages/auth/auth.routes').then((m) => m.authRoutes),
  },

  // Citizen routes
  {
    path: 'citizen',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['citizen'] },
    loadChildren: () => import('./pages/citizen/citizen.routes').then((m) => m.citizenRoutes),
  },

  // Responder routes
  {
    path: 'responder',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['responder'] },
    loadChildren: () => import('./pages/responder/responder.routes').then((m) => m.responderRoutes),
  },

  // Admin routes
  {
    path: 'admin',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin'] },
    loadChildren: () => import('./pages/admin/admin.routes').then((m) => m.adminRoutes),
  },

  // Fallback
  { path: '**', redirectTo: '/auth/login' },
];
