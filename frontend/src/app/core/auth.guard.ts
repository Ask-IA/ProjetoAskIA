// src/app/core/auth.guard.ts
//
// "Segurança na porta" da área logada (/app e filhas).
// Antes de qualquer rota protegida abrir, pergunta ao backend se existe
// sessão válida (GET /auth/me). 200 = deixa passar; 401/erro = manda pro login.
//
// Detalhe importante: o guard só olha o CÓDIGO DE STATUS da resposta.
// O corpo do /auth/me hoje vem vazio (bug conhecido do backend, já reportado
// ao Jorge) — mas isso não afeta o guard, que não precisa dos dados do
// usuário, só de saber se a sessão existe.

import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.me().pipe(
    map(() => true),
    catchError(() => of(router.parseUrl('/login')))
  );
};
