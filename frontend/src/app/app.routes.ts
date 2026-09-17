// src/app/app.routes.ts
//
// As sete seções ficam DENTRO do Layout, como rotas filhas.
// Assim o menu é montado uma vez só e não pisca ao trocar de seção.
//
// Login, cadastro e home ficam fora — não têm menu.
//
// A rota /app inteira é protegida pelo authGuard: sem sessão válida,
// qualquer tentativa de acesso direto (ex.: digitar /app/ask na URL)
// é redirecionada para /login.

import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';

export const routes: Routes = [

  // Páginas sem menu
  {
    path: '',
    loadComponent: () => import('./pages/home/home').then(m => m.Home),
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login').then(m => m.Login),
  },
  {
    path: 'cadastro',
    loadComponent: () => import('./pages/cadastro/cadastro').then(m => m.Cadastro),
  },

  // Aplicação: tudo com menu, tudo protegido
  {
    path: 'app',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/layout').then(m => m.Layout),
    children: [
      { path: '', redirectTo: 'ask', pathMatch: 'full' },

      { path: 'ask',        loadComponent: () => import('./pages/ask-ia/ask-ia').then(m => m.AskIa) },
      { path: 'painel',     loadComponent: () => import('./pages/painel/painel').then(m => m.Painel) },
      { path: 'materias',   loadComponent: () => import('./pages/materias/materias').then(m => m.Materias) },
      { path: 'cronograma', loadComponent: () => import('./pages/cronograma/cronograma').then(m => m.Cronograma) },
      { path: 'flashcards', loadComponent: () => import('./pages/flashcards/flashcards').then(m => m.Flashcards) },
      { path: 'quiz',       loadComponent: () => import('./pages/quiz/quiz').then(m => m.Quiz) },
      { path: 'progresso',  loadComponent: () => import('./pages/progresso/progresso').then(m => m.Progresso) },
    ],
  },

  // Rota inexistente volta para o início
  { path: '**', redirectTo: '' },
];
