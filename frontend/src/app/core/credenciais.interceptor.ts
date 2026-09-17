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

import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../environments/environment';

export const credenciaisInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.url.startsWith(environment.apiUrl)) {
    req = req.clone({ withCredentials: true });
  }
  return next(req);
};
