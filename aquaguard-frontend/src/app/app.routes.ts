import { Routes } from '@angular/router';
import { authGuard, roleGuard } from './core/guards/auth.guard';
import { LayoutComponent } from './shared/layout/layout';

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
    component: LayoutComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['citizen'] },
    loadChildren: () => import('./pages/citizen/citizen.routes').then((m) => m.citizenRoutes),
  },

  // Responder routes
  {
    path: 'responder',
    component: LayoutComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['responder'] },
    loadChildren: () => import('./pages/responder/responder.routes').then((m) => m.responderRoutes),
  },

  // Admin routes
  {
    path: 'admin',
    component: LayoutComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin'] },
    loadChildren: () => import('./pages/admin/admin.routes').then((m) => m.adminRoutes),
  },

  {
    path: 'settings',
    component: LayoutComponent,
    canActivate: [authGuard], // ← bỏ roleGuard, chỉ cần đăng nhập là vào được
    loadChildren: () => import('./pages/settings/settings.routes').then((m) => m.settingsRoutes),
  },

  // Fallback
  { path: '**', redirectTo: '/auth/login' },
];
