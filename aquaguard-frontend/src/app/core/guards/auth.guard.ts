import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    return true;
  }

  router.navigate(['/auth/login']);
  return false;
};

export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const expectedRoles = route.data['roles'] as string[];
  const userRole = authService.getRole();

  if (!authService.isLoggedIn()) {
    router.navigate(['/auth/login']);
    return false;
  }

  if (expectedRoles && !expectedRoles.includes(userRole!)) {
    // Redirect về đúng trang theo role
    if (userRole === 'admin') router.navigate(['/admin']);
    else if (userRole === 'responder') router.navigate(['/responder']);
    else router.navigate(['/citizen']);
    return false;
  }

  return true;
};
