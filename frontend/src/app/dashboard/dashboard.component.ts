import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../shared/services/auth.service';
import { ArticlesService } from '../shared/services/articles.service';
import { CategoriesService } from '../shared/services/categories.service';
import { UsersService } from '../shared/services/users.service';
import { User } from '../shared/models/user.model';
import { Article } from '../shared/models/article.model';
import { Category } from '../shared/models/category.model';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatDividerModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private articlesService = inject(ArticlesService);
  private categoriesService = inject(CategoriesService);
  private usersService = inject(UsersService);

  currentUser: User | null = null;
  recentArticles: Article[] = [];
  popularCategories: Category[] = [];
  stats = {
    totalArticles: 0,
    totalViews: 0,
    totalLikes: 0,
    totalComments: 0,
    published: 0,
    draft: 0,
    pending: 0
  };
  isLoading = true;

  ngOnInit(): void {
    this.currentUser = this.authService.currentUser;
    this.loadDashboardData();
  }

  private loadDashboardData(): void {
    this.isLoading = true;
    
    // Charger les articles de l'utilisateur connecté
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      this.articlesService.getArticles({ 
        page: 1, 
        limit: 5, 
        author: currentUser._id 
      }).subscribe({
        next: (response) => {
          // Gérer le cas où l'API retourne { data: { articles: [] } }
          this.recentArticles = response?.articles || [];
          this.calculateStats();
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error loading user articles:', err);
          this.isLoading = false;
        }
      });
    } else {
      this.isLoading = false;
    }

    // Charger les catégories populaires
    this.categoriesService.getCategories().subscribe({
      next: (response) => {
        // Gérer le cas où l'API retourne { data: [] }
        const categories = Array.isArray(response) ? response : (response as any)?.data || [];
        this.popularCategories = categories
          .sort((a: any, b: any) => (b.articlesCount || 0) - (a.articlesCount || 0))
          .slice(0, 6);
      },
      error: (err) => console.error('Error loading categories:', err)
    });

    }

  private calculateStats(): void {
    if (!this.recentArticles) {
      this.recentArticles = [];
    }
    this.stats.totalArticles = this.recentArticles.length;
    this.stats.totalViews = this.recentArticles.reduce((sum, article) => sum + (article.viewsCount || 0), 0);
    this.stats.totalLikes = this.recentArticles.reduce((sum, article) => sum + (article.likesCount || 0), 0);
    this.stats.totalComments = this.recentArticles.reduce((sum, article) => sum + (article.commentsCount || 0), 0);
    
    // Ajouter les stats par statut
    this.stats.published = this.recentArticles.filter(a => a.status === 'published').length;
    this.stats.draft = this.recentArticles.filter(a => a.status === 'draft').length;
    this.stats.pending = this.recentArticles.filter(a => a.status === 'pending').length;
  }

  
  createNewArticle(): void {
    this.router.navigate(['/articles/new']);
  }

  viewAllArticles(): void {
    this.router.navigate(['/articles']);
  }

  viewArticle(articleId: string): void {
    this.router.navigate(['/articles', articleId]);
  }

  viewCategory(categoryId: string): void {
    this.router.navigate(['/articles'], { 
      queryParams: { category: categoryId } 
    });
  }

  get isAdmin(): boolean {
    return this.authService.isAdmin;
  }

  get isEditor(): boolean {
    return this.authService.isEditor;
  }

  get isAuthor(): boolean {
    return this.authService.isAuthor;
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: (err) => {
        console.error('Logout error:', err);
        this.router.navigate(['/login']);
      }
    });
  }
}
