// src/app/pages/redefinir-senha/redefinir-senha.ts
//
// Troca a senha a partir do link enviado por e-mail (?token=...). O token
// nunca é mostrado nem reeditável: só segue junto na requisição.
//
// Mesma regra de senha do Cadastro (tamanho mínimo + confirmação igual),
// para o aluno não ter duas regras diferentes para decorar.

import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators,
} from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Icone } from '../../shared/icone';

/** Mesmo valor do Cadastro (TAMANHO_MINIMO_SENHA) — o backend valida os dois do mesmo jeito. */
const TAMANHO_MINIMO_SENHA = 6;

function passwordsMatchValidator(group: AbstractControl): ValidationErrors | null {
  const password = group.get('password')?.value;
  const confirmPassword = group.get('confirmPassword')?.value;
  return password === confirmPassword ? null : { passwordsMismatch: true };
}

@Component({
  selector: 'app-redefinir-senha',
  imports: [RouterLink, ReactiveFormsModule, Icone],
  templateUrl: './redefinir-senha.html',
  styleUrl: './redefinir-senha.css',
})
export class RedefinirSenha implements OnInit {
  form: FormGroup;

  errorMessage = signal('');
  loading = signal(false);
  concluido = signal(false);
  mostrarSenha = signal(false);
  mostrarConfirmacao = signal(false);

  /** null = ainda não leu a URL; '' = leu e não tinha token (link quebrado/incompleto). */
  private token = signal<string | null>(null);
  readonly linkValido = signal(true);

  readonly tamanhoMinimo = TAMANHO_MINIMO_SENHA;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.form = this.fb.group(
      {
        password: ['', [Validators.required, Validators.minLength(TAMANHO_MINIMO_SENHA)]],
        confirmPassword: ['', Validators.required],
      },
      { validators: passwordsMatchValidator }
    );
  }

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (!token) {
      this.linkValido.set(false);
      return;
    }
    this.token.set(token);
  }

  get tamanhoSenha(): number {
    return (this.form.get('password')?.value ?? '').length;
  }

  get faltamNaSenha(): number {
    return Math.max(this.tamanhoMinimo - this.tamanhoSenha, 0);
  }

  onSubmit(): void {
    this.errorMessage.set('');
    const token = this.token();
    if (!token) {
      this.linkValido.set(false);
      return;
    }

    if (this.form.invalid) {
      const senha = this.form.get('password');
      if (senha?.hasError('required')) {
        this.errorMessage.set('Informe a nova senha.');
      } else if (senha?.hasError('minlength')) {
        this.errorMessage.set(`A senha precisa ter pelo menos ${this.tamanhoMinimo} caracteres.`);
      } else if (this.form.errors?.['passwordsMismatch']) {
        this.errorMessage.set('As senhas não coincidem.');
      } else {
        this.errorMessage.set('Preencha os campos corretamente.');
      }
      return;
    }

    this.loading.set(true);
    this.authService.redefinirSenha(token, this.form.value.password).subscribe({
      next: () => {
        this.loading.set(false);
        this.concluido.set(true);
      },
      error: (err) => {
        this.loading.set(false);
        // link inválido/expirado: o backend já manda a mensagem certa (ex.: "Esse link expirou.")
        this.errorMessage.set(err.error?.message ?? 'Não foi possível redefinir a senha agora. Tente novamente.');
      },
    });
  }

  irParaLogin(): void {
    this.router.navigateByUrl('/login');
  }
}
