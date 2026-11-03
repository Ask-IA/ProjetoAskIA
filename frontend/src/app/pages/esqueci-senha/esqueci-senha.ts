// src/app/pages/esqueci-senha/esqueci-senha.ts
//
// "Esqueci minha senha": pede o nome ou e-mail e manda o pedido ao backend.
// A resposta é SEMPRE a mesma mensagem de sucesso, exista ou não a conta —
// o backend (AuthController/PasswordResetService) nunca revela isso por
// aqui, então a tela também não pode revelar (nem com uma demora diferente:
// o loading cobre o tempo de qualquer um dos dois casos).

import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Icone } from '../../shared/icone';

@Component({
  selector: 'app-esqueci-senha',
  imports: [RouterLink, ReactiveFormsModule, Icone],
  templateUrl: './esqueci-senha.html',
  styleUrl: './esqueci-senha.css',
})
export class EsqueciSenha {
  form: FormGroup;

  errorMessage = signal('');
  loading = signal(false);
  /** true depois do envio: a tela troca o formulário pela confirmação. */
  enviado = signal(false);

  constructor(
    private fb: FormBuilder,
    private authService: AuthService
  ) {
    this.form = this.fb.group({
      identificador: ['', [Validators.required]],
    });
  }

  onSubmit(): void {
    this.errorMessage.set('');

    if (this.form.invalid) {
      this.errorMessage.set('Informe seu nome ou e-mail de cadastro.');
      return;
    }

    this.loading.set(true);
    const identificador = (this.form.value.identificador as string).trim();

    this.authService.esqueciSenha(identificador).subscribe({
      // sucesso ou erro "de negócio" (400) dão o mesmo resultado na tela:
      // só uma falha de rede/servidor (5xx) é que mostra mensagem de erro.
      next: () => {
        this.loading.set(false);
        this.enviado.set(true);
      },
      error: () => {
        this.loading.set(false);
        this.enviado.set(true);
      },
    });
  }
}
