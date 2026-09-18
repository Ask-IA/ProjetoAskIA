import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-login',
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  form: FormGroup;

  // signals: a resposta do backend chega de forma assíncrona e, no modo
  // zoneless, só o signal avisa o Angular para redesenhar a tela.
  errorMessage = signal('');
  loading = signal(false);
  mostrarSenha = signal(false); // controla o "olhinho" do campo de senha

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

  onSubmit(): void {
    this.errorMessage.set('');

    if (this.form.invalid) {
      this.errorMessage.set('Preencha e-mail e senha corretamente.');
      return;
    }

    this.loading.set(true);
    this.authService.login(this.form.value).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigateByUrl('/app');
      },
      //o tsconfig esta com strict/noImplicitAny, entao todo parametro precisa
      // de tipo declarado. Estava sem tipo e o build quebrava
      // Tipei como HttpErrorResponse para ter autocomplete em err.status e err.error
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.errorMessage.set(err.error?.message ?? 'Não foi possível entrar. Tente novamente.');
      },
    });
  }
}