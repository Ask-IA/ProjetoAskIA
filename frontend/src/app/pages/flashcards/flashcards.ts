// src/app/pages/flashcards/flashcards.ts
//
// Revisão por flashcards com DADOS FALSOS.
// No produto final os cartões serão gerados pela IA (revisão espaçada);
// aqui o fluxo de revisão já funciona: virar, acertei/errei, resumo final.

import { Component, OnInit, inject } from '@angular/core';
import { Flashcard, RevisaoService } from '../../services/revisao.service';

@Component({
  selector: 'app-flashcards',
  standalone: true,
  templateUrl: './flashcards.html',
  styleUrl: './flashcards.css',
})
export class Flashcards implements OnInit {
  private revisao = inject(RevisaoService);

  cartoes: Flashcard[] = [];
  indice = 0;
  virado = false;
  acertos = 0;
  erros = 0;
  terminou = false;
  carregando = true;

  ngOnInit(): void {
    this.revisao.listarFlashcards().subscribe(lista => {
      this.cartoes = lista;
      this.carregando = false;
    });
  }

  get atual(): Flashcard | null {
    return this.cartoes[this.indice] ?? null;
  }

  virar(): void {
    this.virado = !this.virado;
  }

  responder(acertou: boolean): void {
    if (acertou) this.acertos++;
    else this.erros++;

    if (this.indice + 1 >= this.cartoes.length) {
      this.terminou = true;
    } else {
      this.indice++;
      this.virado = false;
    }
  }

  reiniciar(): void {
    this.indice = 0;
    this.virado = false;
    this.acertos = 0;
    this.erros = 0;
    this.terminou = false;
  }
}
