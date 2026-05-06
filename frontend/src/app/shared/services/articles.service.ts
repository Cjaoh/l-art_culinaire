import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';
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
    return this.http.get<ArticlesResponse>(this.apiUrl, { params });
  }

  getArticleById(id: string): Observable<Article> {
    return this.http.get<Article>(`${this.apiUrl}/${id}`);
  }

  // Alias pour compatibilité
  getArticle(id: string): Observable<Article> {
    return this.getArticleById(id);
  }

  createArticle(data: CreateArticleDto): Observable<Article> {
    return this.http.post<Article>(this.apiUrl, data);
  }

  updateArticle(id: string, data: UpdateArticleDto): Observable<Article> {
    return this.http.patch<Article>(`${this.apiUrl}/${id}`, data);
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
    return this.http.get<ModerationStatsResponse>(`${this.apiUrl}/public/stats`);
  }

  incrementViews(id: string): Observable<Article> {
    return this.http.patch<Article>(`${this.apiUrl}/${id}/views`, {});
  }

  toggleLike(id: string): Observable<Article> {
    return this.http.post<Article>(`${this.apiUrl}/${id}/like`, {});
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