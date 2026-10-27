import { Component, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Icone } from '../../shared/icone';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-login',
  imports: [RouterLink, ReactiveFormsModule, Icone],
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
      // e-mail OU nome: por isso não tem Validators.email
      login: ['', [Validators.required]],
      password: ['', Validators.required],
    });
  }

  onSubmit(): void {
    this.errorMessage.set('');

    if (this.form.invalid) {
      this.errorMessage.set('Preencha seu nome ou e-mail e a senha.');
      return;
    }

    this.loading.set(true);
    const { login, password } = this.form.value;
    this.authService.login({ login: login.trim(), password }).subscribe({
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