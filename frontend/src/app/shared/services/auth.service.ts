import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap, catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginDto, RegisterDto, AuthResponse, User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly apiUrl = `${environment.apiUrl}/auth`;
  currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    // Réhydrater depuis localStorage au démarrage
    this.rehydrateFromStorage();
  }

  login(credentials: LoginDto): Observable<AuthResponse> {
    console.log('=== AUTH SERVICE LOGIN ===');
    console.log('Login attempt for:', credentials.email);
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap(response => {
        console.log('Login response received:', response);
        // Les tokens sont dans response.data
        const data = (response as any).data || response;
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        localStorage.setItem('currentUser', JSON.stringify(data.user));
        console.log('Tokens stored in localStorage');
        console.log('Access token:', localStorage.getItem('accessToken')?.substring(0, 20) + '...');
        console.log('Refresh token:', localStorage.getItem('refreshToken')?.substring(0, 20) + '...');
        this.currentUserSubject.next(data.user);
        console.log('User set in subject:', data.user);
        console.log('=== END AUTH SERVICE LOGIN ===');
      })
    );
  }

  register(userData: RegisterDto): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, userData).pipe(
      tap(response => {
        const data = (response as any).data || response;
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        localStorage.setItem('currentUser', JSON.stringify(data.user));
        this.currentUserSubject.next(data.user);
      })
    );
  }

  logout(): Observable<any> {
    return this.http.post(`${this.apiUrl}/logout`, {}).pipe(
      tap(() => {
        this.clearTokens();
        this.currentUserSubject.next(null);
      }),
      catchError((error) => {
        this.clearTokens();
        this.currentUserSubject.next(null);
        return of(null);
      })
    );
  }

  refreshToken(): Observable<AuthResponse> {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      this.logout();
      throw new Error('No refresh token available');
    }

    return this.http.post<AuthResponse>(`${this.apiUrl}/refresh`, { refreshToken }).pipe(
      tap(response => {
        const data = (response as any).data || response;
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        this.currentUserSubject.next(data.user);
      })
    );
  }

  getProfile(): Observable<User> {
    console.log('=== AUTH SERVICE GET PROFILE ===');
    console.log('Making request to:', `${this.apiUrl}/profile`);
    console.log('Current token:', localStorage.getItem('accessToken')?.substring(0, 20) + '...');
    return this.http.get<User>(`${this.apiUrl}/profile`).pipe(
      tap(user => {
        console.log('Profile received:', user);
        this.currentUserSubject.next(user);
        console.log('=== END AUTH SERVICE GET PROFILE ===');
      })
    );
  }

  get currentUser(): User | null {
    return this.currentUserSubject.value;
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  get isAuthenticated(): boolean {
    const token = localStorage.getItem('accessToken');
    const user = this.currentUserSubject.value;
    return !!(token && user);
  }

  get isAdmin(): boolean {
    const user = this.currentUserSubject.value;
    return user?.role === 'admin';
  }

  get isEditor(): boolean {
    const user = this.currentUserSubject.value;
    return user?.role === 'editor' || user?.role === 'admin';
  }

  get isAuthor(): boolean {
    const user = this.currentUserSubject.value;
    return user?.role === 'author' || user?.role === 'editor' || user?.role === 'admin';
  }

  get isModerator(): boolean {
    const user = this.currentUserSubject.value;
    return user?.role === 'moderator' || user?.role === 'admin';
  }

  hasRole(role: string): boolean {
    const user = this.currentUserSubject.value;
    return user?.role === role;
  }

  clearTokens(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('currentUser');
  }

  private rehydrateFromStorage(): void {
    try {
      const token = localStorage.getItem('accessToken');
      const userStr = localStorage.getItem('currentUser');
      
      if (token && userStr) {
        const user = JSON.parse(userStr);
        this.currentUserSubject.next(user);
      }
    } catch (error) {
      console.warn('Error rehydrating auth from storage:', error);
      this.clearTokens();
    }
  }

  private loadUserProfile(): void {
    this.getProfile().subscribe({
      next: (user) => {
        this.currentUserSubject.next(user);
        localStorage.setItem('currentUser', JSON.stringify(user));
      },
      error: (error) => {
        // Si erreur 401, essayer de rafraîchir le token
        if (error.status === 401) {
          this.refreshToken().subscribe({
            next: () => {
              // Réessayer de charger le profil après le rafraîchissement
              this.loadUserProfile();
            },
            error: () => {
              this.clearTokens();
              this.currentUserSubject.next(null);
            }
          });
        } else {
          this.clearTokens();
          this.currentUserSubject.next(null);
        }
      }
    });
  }

  getAccessToken(): string | null {
    return localStorage.getItem('accessToken');
  }
}
