// src/app/core/credenciais.interceptor.ts
//
// A equipe decidiu autenticação por SESSÃO (HttpSession + cookie), não JWT.
// Para o cookie de sessão viajar em TODA chamada à API, cada requisição
// precisa de `withCredentials: true`.
//
// Antes isso era repetido manualmente em cada método do AuthService — o que
// funcionava, mas não escala: bastava esquecer numa chamada nova (chat,
// matérias, redação...) para a sessão "sumir" só naquela funcionalidade.
// Este interceptor centraliza a regra: qualquer requisição para a URL da API
// ganha o withCredentials automaticamente.
//
// Segunda responsabilidade: se a sessão expirar no meio do uso, qualquer
// endpoint de /api/** devolve 401 — e o usuário é levado ao login em vez de
// ver uma tela quebrada. O /auth/me fica de fora porque quem trata o 401 dele
// é o authGuard (senão navegaríamos para o login duas vezes).

import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';

export const credenciaisInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  // Em produção, environment.apiUrl é '' (URLs relativas — ver nginx.conf): nesse
  // caso, "é chamada da API" significa começar com /api ou /auth, não "começar
  // com string vazia" (que combinaria com qualquer URL, inclusive de terceiros).
  const paraApi = environment.apiUrl
    ? req.url.startsWith(environment.apiUrl)
    : req.url.startsWith('/api') || req.url.startsWith('/auth');

  if (paraApi) {
    req = req.clone({ withCredentials: true });
  }

  return next(req).pipe(
    catchError((erro: HttpErrorResponse) => {
      const sessaoExpirou = paraApi && erro.status === 401 && !req.url.endsWith('/auth/me');
      if (sessaoExpirou) {
        router.navigateByUrl('/login');
      }
      return throwError(() => erro);
    })
  );
};
