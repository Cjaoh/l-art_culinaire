import {
  Component, OnInit, OnDestroy, ViewChild,
  ElementRef, inject
} from '@angular/core';
import {
  FormBuilder, ReactiveFormsModule, Validators, FormArray
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Subject, debounceTime, takeUntil } from 'rxjs';
import { AuthService } from '../../shared/services/auth.service';
import { environment } from '../../../environments/environment';

/* ─── Types ─── */
interface Category { _id: string; name: string; icon: string; slug: string; }

@Component({
  selector: 'app-article-editor',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './article-editor.component.html',
  styleUrls: ['./article-editor.component.css']
})
export class ArticleEditorComponent implements OnInit, OnDestroy {

  @ViewChild('contentRef') contentRef!: ElementRef<HTMLTextAreaElement>;

  private fb          = inject(FormBuilder);
  private http        = inject(HttpClient);
  private router      = inject(Router);
  private route       = inject(ActivatedRoute);
  private authService = inject(AuthService);
  private destroy$    = new Subject<void>();

  private readonly apiUrl = environment.apiUrl;

  /* ── État ── */
  isEditing     = false;
  articleId     = '';
  isLoading     = false;
  isSaving      = false;
  currentStatus = 'draft';

  /* ── Toast ── */
  showToast    = false;
  toastError   = false;
  toastMessage = '';
  private toastTimer: any;

  /* ── Catégories & Tags ── */
  categories: Category[]     = [];
  selectedCategories: string[] = [];
  tags: string[]             = [];

  /* ── Formulaire ── */
  articleForm = this.fb.group({
    title:       ['', [Validators.required, Validators.minLength(5)]],
    excerpt:     [''],
    content:     ['', [Validators.required, Validators.minLength(50)]],
    coverImage:  [''],
    categories:  this.fb.array([])
  });

  /** Raccourci template */
  get f() { return this.articleForm.controls; }

  /* ── Stats texte ── */
  get wordCount(): number {
    const text = this.articleForm.get('content')?.value || '';
    return text.trim() ? text.trim().split(/\s+/).length : 0;
  }

  get charCount(): number {
    return (this.articleForm.get('content')?.value || '').length;
  }

  get readingTime(): number {
    return Math.max(1, Math.round(this.wordCount / 200));
  }

  get statusLabel(): string {
    const labels: Record<string, string> = {
      draft:     'Brouillon',
      pending:   'En attente',
      published: 'Publié',
      rejected:  'Refusé'
    };
    return labels[this.currentStatus] ?? 'Brouillon';
  }

  /* ════════════════════════════════════════
     Cycle de vie
  ════════════════════════════════════════ */
  ngOnInit(): void {
    this.loadCategories();

    // Détection route édition vs création
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      if (params['id']) {
        this.isEditing = true;
        this.articleId = params['id'];
        this.loadArticle(params['id']);
      }
    });

    // Recompute stats en live
    this.articleForm.get('content')!.valueChanges
      .pipe(takeUntil(this.destroy$));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    clearTimeout(this.toastTimer);
  }

  /* ════════════════════════════════════════
     Chargement données
  ════════════════════════════════════════ */
  private loadCategories(): void {
    this.http.get<any>(`${this.apiUrl}/categories`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.categories = res.data ?? res ?? [];
        },
        error: () => {
          // Mode dégradé : pas de catégories chargées
          this.categories = [];
        }
      });
  }

  private loadArticle(id: string): void {
    const headers = this.getAuthHeaders();
    this.http.get<any>(`${this.apiUrl}/articles/${id}`, { headers })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          const article = res.data ?? res;
          this.articleForm.patchValue({
            title:      article.title,
            excerpt:    article.excerpt ?? '',
            content:    article.content,
            coverImage: article.coverImage ?? ''
          });
          this.currentStatus        = article.status ?? 'draft';
          this.tags                 = article.tags ?? [];
          this.selectedCategories   = (article.categories ?? [])
            .map((c: any) => c._id ?? c);
        },
        error: () => this.toast('Impossible de charger l\'article', true)
      });
  }

  /* ════════════════════════════════════════
     Actions publication
  ════════════════════════════════════════ */

  /** Sauvegarder en brouillon */
  saveDraft(): void {
    if (this.articleForm.invalid) {
      this.articleForm.markAllAsTouched();
      return;
    }

    this.isSaving  = true;
    this.isLoading = true;
    const payload  = this.buildPayload();

    const req$ = this.isEditing
      ? this.http.patch<any>(
          `${this.apiUrl}/articles/${this.articleId}`,
          payload,
          { headers: this.getAuthHeaders() }
        )
      : this.http.post<any>(
          `${this.apiUrl}/articles`,
          payload,
          { headers: this.getAuthHeaders() }
        );

    req$.pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        const article = res.data ?? res;
        if (!this.isEditing && article._id) {
          this.isEditing = true;
          this.articleId = article._id;
          // Met à jour l'URL sans rechargement
          this.router.navigate(['/articles', this.articleId, 'edit'],
            { replaceUrl: true });
        }
        this.currentStatus = 'draft';
        this.toast('Brouillon sauvegardé ✓');
      },
      error: (err) => {
        this.toast(this.friendlyError(err, 'Erreur lors de la sauvegarde'), true);
      },
      complete: () => {
        this.isLoading = false;
        this.isSaving  = false;
      }
    });
  }

  /** Soumettre pour révision (publie) */
  submitForReview(): void {
    if (this.articleForm.invalid) {
      this.articleForm.markAllAsTouched();
      this.toast('Remplissez les champs obligatoires', true);
      return;
    }

    this.isLoading = true;

    // 1. Sauvegarder d'abord si nécessaire
    const saveFirst$ = this.isEditing
      ? this.http.patch<any>(
          `${this.apiUrl}/articles/${this.articleId}`,
          this.buildPayload(),
          { headers: this.getAuthHeaders() }
        )
      : this.http.post<any>(
          `${this.apiUrl}/articles`,
          this.buildPayload(),
          { headers: this.getAuthHeaders() }
        );

    saveFirst$.pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        const article   = res.data ?? res;
        const id        = this.isEditing ? this.articleId : article._id;
        this.articleId  = id;
        this.isEditing  = true;

        // 2. Soumettre pour révision
        this.http.patch<any>(
          `${this.apiUrl}/articles/${id}/submit`,
          {},
          { headers: this.getAuthHeaders() }
        ).pipe(takeUntil(this.destroy$)).subscribe({
          next: () => {
            this.currentStatus = 'pending';
            this.toast('Article soumis pour révision ✓');
            setTimeout(() => this.router.navigate(['/dashboard']), 1800);
          },
          error: (err) => {
            this.toast(this.friendlyError(err, 'Erreur lors de la soumission'), true);
            this.isLoading = false;
          }
        });
      },
      error: (err) => {
        this.toast(this.friendlyError(err, 'Erreur lors de la sauvegarde'), true);
        this.isLoading = false;
      }
    });
  }

  /* ════════════════════════════════════════
     Catégories & Tags
  ════════════════════════════════════════ */
  isCategorySelected(id: string): boolean {
    return this.selectedCategories.includes(id);
  }

  toggleCategory(id: string): void {
    const idx = this.selectedCategories.indexOf(id);
    if (idx >= 0) {
      this.selectedCategories.splice(idx, 1);
    } else {
      this.selectedCategories.push(id);
    }
  }

  addTag(event: Event): void {
    event.preventDefault();
    const input = event.target as HTMLInputElement;
    const raw   = input.value.replace(',', '').trim().toLowerCase();
    if (raw && !this.tags.includes(raw) && this.tags.length < 10) {
      this.tags.push(raw);
    }
    input.value = '';
  }

  removeTag(tag: string): void {
    this.tags = this.tags.filter(t => t !== tag);
  }

  /* ════════════════════════════════════════
     Markdown helpers
  ════════════════════════════════════════ */
  wrap(before: string, after: string): void {
    const textarea = this.contentRef?.nativeElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end   = textarea.selectionEnd;
    const sel   = textarea.value.substring(start, end);
    const ins   = before + sel + after;
    const value = textarea.value.substring(0, start) + ins + textarea.value.substring(end);

    this.articleForm.get('content')!.setValue(value);

    // Repositionne le curseur
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = start + before.length;
      textarea.selectionEnd   = start + before.length + sel.length;
    });
  }

  insertLink(): void {
    const url   = prompt('URL du lien :');
    const label = prompt('Texte du lien :') ?? 'lien';
    if (url) this.wrap(`[${label}](`, `${url})`);
  }

  /** Auto-resize textarea titre */
  autoGrow(event: Event): void {
    const el = event.target as HTMLTextAreaElement;
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
  }

  clearCoverPreview(): void {
    this.articleForm.get('coverImage')?.setValue('');
  }

  /* ════════════════════════════════════════
     Utilitaires privés
  ════════════════════════════════════════ */
  private buildPayload(): object {
    return {
      title:      this.articleForm.value.title,
      excerpt:    this.articleForm.value.excerpt ?? '',
      content:    this.articleForm.value.content,
      coverImage: this.articleForm.value.coverImage ?? '',
      categories: this.selectedCategories,
      tags:       this.tags
    };
  }

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getAccessToken();
    return new HttpHeaders({
      Authorization:  `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  private toast(msg: string, error = false): void {
    clearTimeout(this.toastTimer);
    this.toastMessage = msg;
    this.toastError   = error;
    this.showToast    = true;
    this.toastTimer   = setTimeout(() => { this.showToast = false; }, 3500);
  }

  private friendlyError(err: any, fallback: string): string {
    if (err?.status === 401) return 'Session expirée, veuillez vous reconnecter.';
    if (err?.status === 403) return 'Vous n\'avez pas les droits pour cette action.';
    if (err?.error?.message) return err.error.message;
    return fallback;
  }
}