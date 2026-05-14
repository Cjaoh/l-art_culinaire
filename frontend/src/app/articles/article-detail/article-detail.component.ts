import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ArticlesService } from '../../shared/services/articles.service';
import { CommentsService } from '../../shared/services/comments.service';
import { AuthService } from '../../shared/services/auth.service';
import { Article } from '../../shared/models/article.model';
import { Comment } from '../../shared/models/comment.model';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-article-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    DatePipe
  ],
  templateUrl: './article-detail.component.html',
  styleUrls: ['./article-detail.component.css']
})
export class ArticleDetailComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private articlesService = inject(ArticlesService);
  private commentsService = inject(CommentsService);
  public authService = inject(AuthService);

  article: Article | null = null;
  comments: Comment[] = [];
  newComment = '';
  isLoading = true;
  private pollingSubscription?: Subscription;

  ngOnInit(): void {
    const articleId = this.route.snapshot.paramMap.get('id');
    if (articleId && articleId !== 'new') {
      this.loadArticle(articleId);
      this.loadComments(articleId);
      
      // Actualisation en temps réel toutes les 5 secondes
      this.pollingSubscription = interval(5000).subscribe(() => {
        this.refreshArticleStats(articleId);
        this.loadComments(articleId);
      });
    } else {
      this.isLoading = false;
      if (articleId === 'new') this.router.navigate(['/articles/new']);
    }
  }

  ngOnDestroy(): void {
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
    }
  }

  refreshArticleStats(id: string): void {
    this.articlesService.getArticle(id).subscribe({
      next: (art: Article) => {
        if (this.article) {
          this.article.viewsCount = art.viewsCount;
          this.article.likesCount = art.likesCount;
          this.article.commentsCount = art.commentsCount;
        }
      }
    });
  }

  loadArticle(id: string): void {
    this.articlesService.getArticle(id).subscribe({
      next: (art: Article) => {
        this.article = art;
        this.isLoading = false;
        this.articlesService.incrementViews(id).subscribe();
      },
      error: (err: any) => {
        console.error('Error loading article:', err);
        this.isLoading = false;
        this.router.navigate(['/']);
      }
    });
  }

  loadComments(articleId: string): void {
    this.commentsService.getCommentsByArticle(articleId).subscribe({
      next: (response: any) => {
        this.comments = response.comments || [];
      },
      error: (err: any) => console.error('Error loading comments:', err)
    });
  }

  // --- FONCTIONS CORRIGÉES POUR LE HTML ---

  likeArticle(): void {
    if (!this.authService.isAuthenticated) {
      this.router.navigate(['/login']);
      return;
    }
    if (this.article) {
      this.articlesService.likeArticle(this.article._id).subscribe({
        next: () => {
          if (this.article) this.article.likesCount++;
        },
        error: (err: any) => console.error('Error liking article:', err)
      });
    }
  }

  shareArticle(): void {
    if (this.article) {
      if (navigator.share) {
        navigator.share({
          title: this.article.title,
          text: this.article.excerpt,
          url: window.location.href
        });
      } else {
        navigator.clipboard.writeText(window.location.href);
        alert('Lien copié !');
      }
    }
  }

  addComment(): void {
    if (!this.authService.isAuthenticated) {
      this.router.navigate(['/login']);
      return;
    }
    if (this.newComment.trim() && this.article) {
      this.commentsService.createComment({
        content: this.newComment,
        article: this.article._id
      }).subscribe({
        next: (comment: Comment) => {
          this.comments.unshift(comment);
          this.newComment = '';
          if (this.article) this.article.commentsCount++;
        }
      });
    }
  }

  getAuthorInitials(author: any): string {
    if (author?.firstName && author?.lastName) {
      return `${author.firstName[0]}${author.lastName[0]}`.toUpperCase();
    }
    return '??';
  }

  private extractContent(html: string, keyword: string, tag: string): string {
    if (!html) return '';
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const headers = Array.from(doc.querySelectorAll('h2'));
    const target = headers.find(h => h.textContent?.toLowerCase().includes(keyword.toLowerCase()));
    const sibling = target?.nextElementSibling;
    return (sibling && sibling.tagName === tag.toUpperCase()) ? sibling.outerHTML : '';
  }

  extractIngredients(content: string): string {
    return this.extractContent(content, 'ingrédients', 'ul') || '<ul><li>Non spécifié</li></ul>';
  }

  extractPreparation(content: string): string {
    return this.extractContent(content, 'préparation', 'ol') || '<ol><li>Non spécifié</li></ol>';
  }

  extractTiming(content: string): string {
    return this.extractContent(content, 'temps', 'p');
  }

  printRecipe(): void {
    window.print();
  }
}
