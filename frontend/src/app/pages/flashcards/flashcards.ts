// src/app/pages/flashcards/flashcards.ts
//
// Revisão por flashcards (ainda com DADOS FALSOS).
// `cartoes` e `carregando` são signals porque chegam de forma assíncrona —
// no modo zoneless, só o signal avisa o Angular para redesenhar a tela.

import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Flashcard, RevisaoService } from '../../services/revisao.service';

@Component({
  selector: 'app-flashcards',
  standalone: true,
  templateUrl: './flashcards.html',
  styleUrl: './flashcards.css',
})
export class Flashcards implements OnInit {
  private revisao = inject(RevisaoService);

  cartoes = signal<Flashcard[]>([]);
  carregando = signal(true);
  erro = signal('');

  indice = signal(0);
  virado = signal(false);
  acertos = signal(0);
  erros = signal(0);
  terminou = signal(false);

  atual = computed<Flashcard | null>(() => this.cartoes()[this.indice()] ?? null);

  ngOnInit(): void {
    this.revisao.listarFlashcards().subscribe({
      next: lista => {
        this.cartoes.set(lista);
        this.carregando.set(false);
      },
      error: () => {
        this.carregando.set(false);
        this.erro.set('Não foi possível carregar seus flashcards.');
      },
    });
  }

  virar(): void {
    this.virado.update(v => !v);
  }

  responder(acertou: boolean): void {
    if (acertou) this.acertos.update(n => n + 1);
    else this.erros.update(n => n + 1);

    if (this.indice() + 1 >= this.cartoes().length) {
      this.terminou.set(true);
    } else {
      this.indice.update(i => i + 1);
      this.virado.set(false);
    }
  }

  reiniciar(): void {
    this.indice.set(0);
    this.virado.set(false);
    this.acertos.set(0);
    this.erros.set(0);
    this.terminou.set(false);
  }
}
