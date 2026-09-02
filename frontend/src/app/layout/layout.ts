// src/app/layout/layout.ts
//
// Esqueleto compartilhado pelas sete seções da aplicação.
// O menu fica aqui; cada seção entra pelo <router-outlet> como filha.

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

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
}