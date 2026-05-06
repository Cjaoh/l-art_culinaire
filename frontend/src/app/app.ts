import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink } from '@angular/router';
import { AuthService } from './shared/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink
  ],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App {
  title = 'CMS Blog Collaboratif';
  
  // États pour le header
  searchExpanded = false;
  userDropdownOpen = false;
  mobileMenuOpen = false;
  
  constructor(public authService: AuthService) {
    // Fermer les dropdowns au clic extérieur
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (!target?.closest('.user-menu')) {
        this.userDropdownOpen = false;
      }
    });
  }
  
  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        window.location.href = '/login';
      },
      error: (err) => {
        console.error('Logout error:', err);
        window.location.href = '/login';
      }
    });
  }
  
  // Méthodes pour la recherche
  toggleSearch(): void {
    this.searchExpanded = !this.searchExpanded;
    if (this.searchExpanded) {
      setTimeout(() => {
        const searchInput = document.querySelector('.search-input') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
      }, 100);
    }
  }
  
  collapseSearch(): void {
    setTimeout(() => {
      this.searchExpanded = false;
    }, 200);
  }
  
  onSearch(query: string): void {
    if (query.trim()) {
      window.location.href = `/articles?q=${encodeURIComponent(query.trim())}`;
    }
  }
  
  // Méthodes pour le dropdown utilisateur
  toggleUserDropdown(): void {
    this.userDropdownOpen = !this.userDropdownOpen;
  }
  
  // Méthodes pour le menu mobile
  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
    document.body.style.overflow = this.mobileMenuOpen ? 'hidden' : '';
  }
  
  closeMobileMenu(): void {
    this.mobileMenuOpen = false;
    document.body.style.overflow = '';
  }
}
