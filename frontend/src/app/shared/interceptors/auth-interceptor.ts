import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('accessToken');
  
  console.log('=== INTERCEPTOR DEBUG ===');
  console.log('URL:', req.url);
  console.log('Method:', req.method);
  console.log('Token exists:', !!token);
  console.log('Token value:', token?.substring(0, 20) + '...');
  console.log('Headers:', req.headers.keys());

  // Ne pas ajouter le token pour les requêtes d'authentification
  if (req.url.includes('/auth/login') || req.url.includes('/auth/register') || req.url.includes('/auth/refresh')) {
    console.log('Skipping auth for auth endpoints');
    console.log('=== END INTERCEPTOR ===');
    return next(req);
  }

  // Si on a un token, on clone la requête pour ajouter le header
  if (token) {
    console.log('Adding Authorization header');
    const cloned = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log('Cloned headers:', cloned.headers.keys());
    console.log('=== END INTERCEPTOR ===');
    return next(cloned);
  }

  console.log('No token found - proceeding without auth');
  console.log('=== END INTERCEPTOR ===');
  return next(req);
};
