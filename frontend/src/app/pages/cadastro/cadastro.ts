import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

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

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.form = this.fb.group(
      {
        email: ['', [Validators.required, Validators.email]],
        name: ['', Validators.required],
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', Validators.required],
      },
      { validators: passwordsMatchValidator }
    );
  }

  onSubmit(): void {
    this.errorMessage = '';

    if (this.form.invalid) {
      if (this.form.errors?.['passwordsMismatch']) {
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