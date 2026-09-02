// src/app/app.routes.ts
//
// As sete seções ficam DENTRO do Layout, como rotas filhas.
// Assim o menu é montado uma vez só e não pisca ao trocar de seção.
//
// Login, cadastro e home ficam fora — não têm menu.

import { Routes } from '@angular/router';

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

  // Aplicação: tudo com menu
  {
    path: 'app',
    loadComponent: () => import('./layout/layout').then(m => m.Layout),
    children: [
      { path: '', redirectTo: 'ask', pathMatch: 'full' },

      // TODO: trocar por cada componente conforme forem criados.
      // Por enquanto todas apontam para a mesma tela de rascunho,
      // só para o menu funcionar de ponta a ponta.
      { path: 'ask',        loadComponent: () => import('./pages/rascunho/rascunho').then(m => m.Rascunho) },
      { path: 'painel',     loadComponent: () => import('./pages/rascunho/rascunho').then(m => m.Rascunho) },
      { path: 'materias',   loadComponent: () => import('./pages/rascunho/rascunho').then(m => m.Rascunho) },
      { path: 'cronograma', loadComponent: () => import('./pages/rascunho/rascunho').then(m => m.Rascunho) },
      { path: 'flashcards', loadComponent: () => import('./pages/rascunho/rascunho').then(m => m.Rascunho) },
      { path: 'quiz',       loadComponent: () => import('./pages/rascunho/rascunho').then(m => m.Rascunho) },
      { path: 'progresso',  loadComponent: () => import('./pages/rascunho/rascunho').then(m => m.Rascunho) },
    ],
  },

  // Rota inexistente volta para o início
  { path: '**', redirectTo: '' },
];