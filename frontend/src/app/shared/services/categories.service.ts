import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { 
  Category, 
  CreateCategoryDto, 
  UpdateCategoryDto,
  CategoryStatus 
} from '../models/category.model';

@Injectable({
  providedIn: 'root'
})
export class CategoriesService {
  private readonly apiUrl = `${environment.apiUrl}/categories`;

  constructor(private http: HttpClient) {}

  getCategories(status = CategoryStatus.ACTIVE): Observable<Category[]> {
    const params = { status };
    return this.http.get<any>(this.apiUrl, { params }).pipe(
      map(res => res.data ? res.data : res)
    );
  }

  getCategoryTree(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.apiUrl}/tree`);
  }

  getPopularCategories(limit = 10): Observable<Category[]> {
    const params = { limit: limit.toString() };
    return this.http.get<Category[]>(`${this.apiUrl}/popular`, { params });
  }

  getCategory(id: string): Observable<Category> {
    return this.http.get<Category>(`${this.apiUrl}/${id}`);
  }

  getCategoryBySlug(slug: string): Observable<Category> {
    return this.http.get<Category>(`${this.apiUrl}/slug/${slug}`);
  }

  createCategory(categoryData: CreateCategoryDto): Observable<Category> {
    return this.http.post<Category>(this.apiUrl, categoryData);
  }

  updateCategory(id: string, categoryData: UpdateCategoryDto): Observable<Category> {
    return this.http.patch<Category>(`${this.apiUrl}/${id}`, categoryData);
  }

  deleteCategory(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
