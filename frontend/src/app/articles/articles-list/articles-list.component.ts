import { Component, inject, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { ArticlesService } from '../../shared/services/articles.service';
import { CategoriesService } from '../../shared/services/categories.service';
import { AuthService } from '../../shared/services/auth.service';
import { UserService } from '../../shared/services/user.service';
import { Article, ArticleStatus, ModerationStats, ModerationStatsResponse } from '../../shared/models/article.model';
import { Category } from '../../shared/models/category.model';
import { ArticlesResponse } from '../../shared/models/article.model';
import { User } from '../../shared/models/user.model';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';

interface ArticleFilters {
  search: string;
  category: string;
  status: string;
  author: string;
  sortBy: string;
}

@Component({
  selector: 'app-articles-list',
  standalone: true,
  imports: [
    RouterLink,
    CommonModule,
    FormsModule
  ],
  templateUrl: './articles-list.component.html',
  styleUrls: ['./articles-list.component.scss']
})
export class ArticlesListComponent implements OnInit, OnDestroy {
  private articlesService = inject(ArticlesService);
  private categoriesService = inject(CategoriesService);
  private userService = inject(UserService);
  public authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  articles: Article[] = [];
  categories: Category[] = [];
  topAuthors: User[] = [];
  moderationStats: ModerationStats = { published: 0, pending: 0, rejected: 0, total: 0 };
  
  total = 0;
  totalPages = 0;
  currentPage = 1;
  pageSize = 12;
  loading = false;
  error: string | null = null;
  
  filters: ArticleFilters = {
    search: '',
    category: '',
    status: '',
    author: '',
    sortBy: 'recent'
  };
  
  stats = {
    published: 0,
    pending: 0
  };

  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.initializeSearchDebouncer();
    this.loadData();
  }

  private initializeSearchDebouncer(): void {
    this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.currentPage = 1;
      this.loadArticles();
    });
  }

  private loadData(): void {
    this.loadArticles();
    this.loadCategories();
    this.loadTopAuthors();
    
    if (this.authService.isModerator) {
      this.loadModerationStats();
    }
  }

  loadArticles(): void {
    this.loading = true;
    this.error = null;
    
    const requestFilters = {
      page: this.currentPage,
      limit: this.pageSize,
      ...this.filters
    };

    // Filtrer les valeurs vides
    Object.keys(requestFilters).forEach(key => {
      if (!requestFilters[key as keyof typeof requestFilters]) {
        delete requestFilters[key as keyof typeof requestFilters];
      }
    });

    this.articlesService.getArticles(requestFilters).subscribe({
      next: (response: ArticlesResponse) => {
        // Utiliser setTimeout pour éviter NG0100
        setTimeout(() => {
          this.articles = response.articles;
          this.total = response.total;
          this.totalPages = Math.ceil(this.total / this.pageSize);
          this.loading = false;
          
          // Mettre à jour les stats
          this.updateStats();
        });
      },
      error: (err) => {
        console.error('Error fetching articles:', err);
        setTimeout(() => {
          this.error = 'Erreur lors du chargement des articles. Veuillez réessayer.';
          this.loading = false;
          this.articles = this.getMockArticles();
          this.total = this.articles.length;
          this.totalPages = 1;
          this.updateStats();
        });
      }
    });
  }

  loadCategories(): void {
    this.categoriesService.getCategories().subscribe({
      next: (data) => {
        this.categories = data;
      },
      error: (err) => {
        console.error('Error fetching categories:', err);
        this.categories = this.getMockCategories();
      }
    });
  }

  loadTopAuthors(): void {
    this.userService.getTopAuthors().subscribe({
      next: (authors) => {
        this.topAuthors = authors && Array.isArray(authors) ? authors.slice(0, 3) : [];
      },
      error: (err) => {
        console.error('Error fetching top authors:', err);
        this.topAuthors = this.getMockTopAuthors().slice(0, 3);
      }
    });
  }

  loadModerationStats(): void {
    this.articlesService.getModerationStats().subscribe({
      next: (statsResponse: ModerationStatsResponse) => {
        this.moderationStats = statsResponse.data;
        this.stats.pending = statsResponse.data.pending;
      },
      error: (err) => {
        console.error('Error fetching moderation stats:', err);
        this.moderationStats = this.getMockModerationStats();
        this.stats.pending = this.moderationStats.pending;
      }
    });
  }

  private updateStats(): void {
    if (this.articles && Array.isArray(this.articles)) {
      this.stats.published = this.articles.filter(a => a.status === 'published').length;
    } else {
      this.stats.published = 0;
    }
  }

  // Gestion des filtres
  onSearchChange(query: string): void {
    this.filters.search = query;
    this.searchSubject.next(query);
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.loadArticles();
  }

  setSortBy(sortBy: string): void {
    this.filters.sortBy = sortBy;
    this.currentPage = 1;
    this.loadArticles();
  }

  clearFilters(): void {
    this.filters = {
      search: '',
      category: '',
      status: '',
      author: '',
      sortBy: 'recent'
    };
    this.currentPage = 1;
    this.loadArticles();
  }

  // Pagination
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.currentPage = page;
      this.loadArticles();
    }
  }

  getVisiblePages(): (number | string)[] {
    const pages: (number | string)[] = [];
    const maxVisible = 7;
    
    if (this.totalPages <= maxVisible) {
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      
      if (this.currentPage <= 3) {
        for (let i = 2; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(this.totalPages);
      } else if (this.currentPage >= this.totalPages - 2) {
        pages.push('...');
        for (let i = this.totalPages - 3; i <= this.totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push('...');
        for (let i = this.currentPage - 1; i <= this.currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(this.totalPages);
      }
    }
    
    return pages;
  }

  // TrackBy functions pour performance
  trackByArticleId(index: number, article: Article): string {
    return article._id;
  }

  trackByUserId(index: number, user: User): string {
    return user._id;
  }

  // Helper functions pour l'affichage
  getArticleEmoji(article: Article): string {
    const categoryEmojis: { [key: string]: string } = {
      'entrées': '🥗',
      'plats': '🍖',
      'desserts': '🍰',
      'cuisine du monde': '🌍'
    };
    
    const categoryName = article.categories[0]?.name.toLowerCase();
    for (const [key, emoji] of Object.entries(categoryEmojis)) {
      if (categoryName.includes(key.toLowerCase())) {
        return emoji;
      }
    }
    return '🍽️';
  }

  getCategoryColorClass(categoryName?: string): string {
    if (!categoryName) return '';
    
    const name = categoryName.toLowerCase();
    if (name.includes('entr') || name.includes('appetiz') || name.includes('start')) return 'entrées';
    if (name.includes('plat') || name.includes('main')) return 'plats';
    if (name.includes('dessert') || name.includes('sweet')) return 'desserts';
    if (name.includes('monde') || name.includes('world') || name.includes('international')) return 'cuisine-du-monde';
    
    return '';
  }

  getStatusClass(status: string): string {
    return status || 'published';
  }

  getStatusText(status: string): string {
    const texts: { [key: string]: string } = {
      'published': 'Publié',
      'pending': 'En attente',
      'rejected': 'Rejeté',
      'draft': 'Brouillon'
    };
    return texts[status] || 'Publié';
  }

  getAuthorInitials(author: any): string {
    if (author?.firstName && author?.lastName) {
      return `${author.firstName[0]}${author.lastName[0]}`.toUpperCase();
    }
    return '??';
  }

  getAuthorLevelClass(level: string): string {
    return level || 'Intermédiaire';
  }

  getRating(article: Article): number {
    if (article.viewsCount === 0) return 0;
    const engagement = (article.likesCount + article.commentsCount) / article.viewsCount;
    return Math.min(5, Math.round(engagement * 20) / 10);
  }

  getPercentage(value: number, total: number): number {
    return total > 0 ? (value / total) * 100 : 0;
  }

  // Mock data pour le développement
  private getMockArticles(): Article[] {
    return [
      {
        _id: '1',
        title: 'Risotto aux champignons sauvages',
        slug: 'risotto-champignons',
        excerpt: 'Un risotto crémeux et parfumé',
        content: 'Contenu...',
        author: { _id: 'a1', firstName: 'Marie', lastName: 'Dubois' },
        categories: [{ _id: 'c1', name: 'Plats', slug: 'plats' }],
        tags: ['risotto', 'champignons'],
        status: 'published' as any,
        featureStatus: 'none' as any,
        viewsCount: 1250,
        likesCount: 89,
        commentsCount: 23,
        images: [],
        allowComments: true,
        isPinned: false,
        readTimeMinutes: 25,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        _id: '2',
        title: 'Tarte aux pommes',
        slug: 'tarte-pommes',
        excerpt: 'La tarte classique',
        content: 'Contenu...',
        author: { _id: 'a2', firstName: 'Pierre', lastName: 'Martin' },
        categories: [{ _id: 'c2', name: 'Desserts', slug: 'desserts' }],
        tags: ['tarte', 'pommes'],
        status: 'pending' as any,
        featureStatus: 'none' as any,
        viewsCount: 890,
        likesCount: 67,
        commentsCount: 15,
        images: [],
        allowComments: true,
        isPinned: false,
        readTimeMinutes: 40,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
  }

  private getMockCategories(): Category[] {
    return [
      { 
        _id: 'c1', 
        name: 'Entrées', 
        slug: 'entrees', 
        description: 'Plats légers',
        children: [],
        status: 'active' as any,
        articlesCount: 25,
        sortOrder: 1,
        parent: undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      { 
        _id: 'c2', 
        name: 'Plats', 
        slug: 'plats', 
        description: 'Plats principaux',
        children: [],
        status: 'active' as any,
        articlesCount: 45,
        sortOrder: 2,
        parent: undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      { 
        _id: 'c3', 
        name: 'Desserts', 
        slug: 'desserts', 
        description: 'Sucreries',
        children: [],
        status: 'active' as any,
        articlesCount: 30,
        sortOrder: 3,
        parent: undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      { 
        _id: 'c4', 
        name: 'Cuisine du monde', 
        slug: 'cuisine-monde', 
        description: 'Recettes internationales',
        children: [],
        status: 'active' as any,
        articlesCount: 20,
        sortOrder: 4,
        parent: undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
  }

  private getMockTopAuthors(): User[] {
    return [
      {
        _id: 'u1',
        firstName: 'Marie',
        lastName: 'Dubois',
        email: 'marie@example.com',
        role: 'author' as any,
        status: 'active' as any,
        articlesCount: 23,
        level: 'Expert',
        specialties: ['cuisine française'],
        emailVerified: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        _id: 'u2',
        firstName: 'Pierre',
        lastName: 'Martin',
        email: 'pierre@example.com',
        role: 'author' as any,
        status: 'active' as any,
        articlesCount: 18,
        level: 'Avancé',
        specialties: ['cuisine italienne'],
        emailVerified: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        _id: 'u3',
        firstName: 'Sophie',
        lastName: 'Leroy',
        email: 'sophie@example.com',
        role: 'author' as any,
        status: 'active' as any,
        articlesCount: 15,
        level: 'Intermédiaire',
        specialties: ['cuisine végétarienne'],
        emailVerified: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
  }

  private getMockModerationStats(): ModerationStats {
    return {
      published: 156,
      pending: 12,
      rejected: 8,
      total: 176
    };
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
