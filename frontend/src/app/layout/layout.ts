// src/app/layout/layout.ts
//
// Esqueleto compartilhado pelas sete seções da aplicação.
// O menu fica aqui; cada seção entra pelo <router-outlet> como filha.

import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../services/auth.service';

interface ItemMenu {
  rotulo: string;
  rota: string;
  icone: string;
}

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './layout.html',
  styleUrl: './layout.css',
})
export class Layout {
  private auth = inject(AuthService);
  private router = inject(Router);

  saindo = signal(false); // signal: o app é zoneless

  // Ask IA vem primeiro: a ordem do menu comunica a prioridade do produto.
  itens: ItemMenu[] = [
    { rotulo: 'Ask IA',     rota: '/app/ask',        icone: '✦' },
    { rotulo: 'Painel',     rota: '/app/painel',     icone: '▦' },
    { rotulo: 'Matérias',   rota: '/app/materias',   icone: '☰' },
    { rotulo: 'Cronograma', rota: '/app/cronograma', icone: '▤' },
    { rotulo: 'Flashcards', rota: '/app/flashcards', icone: '◧' },
    { rotulo: 'Quiz IA',    rota: '/app/quiz',       icone: '◔' },
    { rotulo: 'Progresso',  rota: '/app/progresso',  icone: '◈' },
  ];

  sair(): void {
    if (this.saindo()) return;
    this.saindo.set(true);
    this.auth.logout().subscribe({
      // Mesmo se o backend falhar, o usuário volta para o login:
      // a pior experiência seria clicar em "Sair" e nada acontecer.
      next: () => this.irParaLogin(),
      error: () => this.irParaLogin(),
    });
  }

  private irParaLogin(): void {
    this.saindo.set(false);
    this.router.navigateByUrl('/login');
  }
}
