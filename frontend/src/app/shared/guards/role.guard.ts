import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    const requiredRoles = route.data?.['roles'] as string[] || [];
    
    if (!this.authService.isAuthenticated) {
      this.router.navigate(['/login'], { 
        queryParams: { returnUrl: state.url } 
      });
      return false;
    }

    if (requiredRoles.length === 0) {
      return true; // Pas de rôles requis
    }

    const hasRequiredRole = requiredRoles.some(role => 
      this.authService.hasRole(role)
    );

    if (!hasRequiredRole) {
      this.router.navigate(['/']); // Rediriger vers l'accueil si rôle insuffisant
      return false;
    }

    return true;
  }
}
