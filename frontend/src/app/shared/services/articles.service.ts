import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Article, CreateArticleDto, UpdateArticleDto, ArticlesResponse, ModerationStats, ModerationStatsResponse, Activity } from '../models/article.model';
import { Category } from '../models/category.model';

@Injectable({ providedIn: 'root' })
export class ArticlesService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/articles`;
  private readonly categoriesUrl = `${environment.apiUrl}/categories`;
  
  // Cache pour les catégories
  private categoriesCache$?: Observable<Category[]>;

  // =========================
  // ARTICLES CRUD
  // =========================

  getArticles(filters: any = {}): Observable<ArticlesResponse> {
    let params = new HttpParams();
    Object.keys(filters).forEach(key => {
      if (filters[key]) params = params.set(key, filters[key]);
    });
    return this.http.get<any>(this.apiUrl, { params }).pipe(
      map(response => {
        if (response.data && response.meta) {
          return {
            articles: response.data,
            total: response.meta.total,
            pages: response.meta.pages
          } as ArticlesResponse;
        }
        return response as ArticlesResponse;
      })
    );
  }

  getArticleById(id: string): Observable<Article> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map(res => res.data ? res.data : res)
    );
  }

  // Alias pour compatibilité
  getArticle(id: string): Observable<Article> {
    return this.getArticleById(id);
  }

  createArticle(data: CreateArticleDto): Observable<Article> {
    return this.http.post<any>(this.apiUrl, data).pipe(
      map(res => res.data ? res.data : res)
    );
  }

  updateArticle(id: string, data: UpdateArticleDto): Observable<Article> {
    return this.http.patch<any>(`${this.apiUrl}/${id}`, data).pipe(
      map(res => res.data ? res.data : res)
    );
  }

  deleteArticle(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // =========================
  // ENDPOINTS SPÉCIFIQUES
  // =========================

  getFeaturedArticles(): Observable<Article[]> {
    return this.http.get<Article[]>(`${this.apiUrl}/featured`);
  }

  getLatestActivity(): Observable<Activity[]> {
    return this.http.get<Activity[]>(`${this.apiUrl}/activity`);
  }

  getModerationStats(): Observable<ModerationStatsResponse> {
    return this.http.get<ModerationStatsResponse>(`${this.apiUrl}/stats`);
  }

  incrementViews(id: string): Observable<Article> {
    return this.http.patch<any>(`${this.apiUrl}/${id}/view`, {}).pipe(
      map(res => res.data ? res.data : res)
    );
  }

  toggleLike(id: string): Observable<Article> {
    return this.http.patch<any>(`${this.apiUrl}/${id}/like`, {}).pipe(
      map(res => res.data ? res.data : res)
    );
  }

  // Alias pour compatibilité
  likeArticle(id: string): Observable<Article> {
    return this.toggleLike(id);
  }

  // =========================
  // CATÉGORIES
  // =========================

  getCategories(): Observable<Category[]> {
    // Utilisation du cache avec shareReplay(1)
    if (!this.categoriesCache$) {
      this.categoriesCache$ = this.http.get<Category[]>(this.categoriesUrl).pipe(
        shareReplay(1)
      );
    }
    return this.categoriesCache$;
  }

  // =========================
  // RECETTES (si utilisé)
  // =========================

  searchRecipes(filters: any = {}): Observable<any> {
    let params = new HttpParams();
    Object.keys(filters).forEach(key => {
      if (filters[key]) params = params.set(key, filters[key]);
    });
    return this.http.get<any>(`${this.apiUrl}/recipes/search`, { params });
  }

  getRecipesByIngredients(ingredients: string[]): Observable<any> {
    const params = new HttpParams().set('ingredients', ingredients.join(','));
    return this.http.get<any>(`${this.apiUrl}/recipes/by-ingredients`, { params });
  }

  getRecipesByCookingTime(maxMinutes: number): Observable<any> {
    const params = new HttpParams().set('maxMinutes', maxMinutes.toString());
    return this.http.get<any>(`${this.apiUrl}/recipes/by-cooking-time`, { params });
  }

  // =========================
  // API STATS
  // =========================

  getApiStats(): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/stats`);
  }

  // =========================
  // UTILITAIRE
  // =========================

  // Invalider le cache des catégories si nécessaire
  clearCategoriesCache(): void {
    this.categoriesCache$ = undefined;
  }
}