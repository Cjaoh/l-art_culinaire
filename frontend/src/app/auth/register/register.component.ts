import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../shared/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  private authService = inject(AuthService);
  private router      = inject(Router);
  private fb          = inject(FormBuilder);

  registerForm = this.fb.group({
    firstName: ['', Validators.required],
    lastName:  ['', Validators.required],
    email:     ['', [Validators.required, Validators.email]],
    password:  ['', [Validators.required, Validators.minLength(6)]]
  });

  hidePassword = true;
  isLoading    = false;
  errorMessage = '';

  /** Raccourci pratique pour le template */
  get f() { return this.registerForm.controls; }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isLoading    = true;
    this.errorMessage = '';

    const { firstName, lastName, email, password } = this.registerForm.value;

    this.authService.register({
      firstName: firstName!,
      lastName:  lastName!,
      email:     email!,
      password:  password!
    }).subscribe({
      next: () => {
        setTimeout(() => this.router.navigate(['/']), 120);
      },
      error: (err) => {
        this.isLoading    = false;
        this.errorMessage =
          err?.status === 409
            ? 'Cet email est déjà utilisé.'
            : 'Une erreur est survenue. Veuillez réessayer.';
        console.error('Register error:', err);
      },
      complete: () => { this.isLoading = false; }
    });
  }
}