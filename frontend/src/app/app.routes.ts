import { Routes } from '@angular/router';
import { AuthGuard }  from './shared/guards/auth.guard';
import { AdminGuard } from './shared/guards/admin.guard';
import { RoleGuard }  from './shared/guards/role.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'articles',
    loadComponent: () =>
      import('./articles/articles-list/articles-list.component')
        .then(m => m.ArticlesListComponent)
  },
  {
    /* ── Créer un article ──
       Ouvert à TOUS les utilisateurs connectés.
       Le rôle "author" est attribué par défaut à l'inscription
       (voir UsersService.create côté backend).
       Si vous voulez restreindre : ajoutez RoleGuard + data.roles  */
    path: 'articles/new',
    loadComponent: () =>
      import('./articles/article-editor/article-editor.component')
        .then(m => m.ArticleEditorComponent),
    canActivate: [AuthGuard]
  },
  {
    /* ── Éditer un article existant ── */
    path: 'articles/:id/edit',
    loadComponent: () =>
      import('./articles/article-editor/article-editor.component')
        .then(m => m.ArticleEditorComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'articles/:id',
    loadComponent: () =>
      import('./articles/article-detail/article-detail.component')
        .then(m => m.ArticleDetailComponent)
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./auth/register/register.component')
        .then(m => m.RegisterComponent)
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'admin',
    loadComponent: () =>
      import('./admin/admin.component').then(m => m.AdminComponent),
    canActivate: [AdminGuard]
  },
  { path: '**', redirectTo: '' }
];