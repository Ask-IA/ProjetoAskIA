import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

/** Tamanho mínimo da senha. O MESMO valor é validado no backend (UserService). */
export const TAMANHO_MINIMO_SENHA = 6;

// valida se "password" e "confirmPassword" são iguais
function passwordsMatchValidator(group: AbstractControl): ValidationErrors | null {
  const password = group.get('password')?.value;
  const confirmPassword = group.get('confirmPassword')?.value;
  return password === confirmPassword ? null : { passwordsMismatch: true };
}

@Component({
  selector: 'app-cadastro',
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './cadastro.html',
  styleUrl: './cadastro.css',
})
export class Cadastro {
  form: FormGroup;
  errorMessage = '';
  loading = false;

  // "olhinhos" — um para cada campo de senha
  mostrarSenha = false;
  mostrarConfirmacao = false;

  readonly tamanhoMinimo = TAMANHO_MINIMO_SENHA;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.form = this.fb.group(
      {
        email: ['', [Validators.required, Validators.email]],
        name: ['', Validators.required],
        password: ['', [Validators.required, Validators.minLength(TAMANHO_MINIMO_SENHA)]],
        confirmPassword: ['', Validators.required],
      },
      { validators: passwordsMatchValidator }
    );
  }

  /** Quantos caracteres a senha tem agora (para a dica ao vivo). */
  get tamanhoSenha(): number {
    return (this.form.get('password')?.value ?? '').length;
  }

  /** Quantos ainda faltam para o mínimo (0 quando já atingiu). */
  get faltamNaSenha(): number {
    return Math.max(this.tamanhoMinimo - this.tamanhoSenha, 0);
  }

  onSubmit(): void {
    this.errorMessage = '';

    if (this.form.invalid) {
      // mensagem específica por problema, em vez de uma genérica
      const senha = this.form.get('password');
      if (this.form.get('email')?.invalid) {
        this.errorMessage = 'Informe um e-mail válido.';
      } else if (this.form.get('name')?.invalid) {
        this.errorMessage = 'Informe seu nome.';
      } else if (senha?.hasError('required')) {
        this.errorMessage = 'Informe uma senha.';
      } else if (senha?.hasError('minlength')) {
        this.errorMessage = `A senha precisa ter pelo menos ${this.tamanhoMinimo} caracteres.`;
      } else if (this.form.errors?.['passwordsMismatch']) {
        this.errorMessage = 'As senhas não coincidem.';
      } else {
        this.errorMessage = 'Preencha todos os campos corretamente.';
      }
      return;
    }

    this.loading = true;
    const { email, name, password } = this.form.value;

    this.authService.register({ email, name, password }).subscribe({
      next: () => {
        this.loading = false;
        // cadastro deu certo -> manda pro login
        this.router.navigateByUrl('/login');
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message ?? 'Não foi possível cadastrar. Tente novamente.';
      },
    });
  }
}
