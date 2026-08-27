import { Routes } from '@angular/router';

export const routes: Routes = [
    {
    path: '',
    loadComponent: () => import('./pages/home/home').then(m => m.Home) // Ajuste para o nome da classe do seu home.ts (ex: Home ou HomeComponent)
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login').then(m => m.Login) // Ajuste para o nome da classe do seu login.ts (ex: Login ou LoginComponent)
  },
  {
    path: 'cadastro',
    loadComponent: () => import('./pages/cadastro/cadastro').then(m => m.Cadastro)
  }
];
