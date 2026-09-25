// src/app/pages/flashcards/flashcards.ts
//
// Revisão por flashcards (ainda com DADOS FALSOS).
// `cartoes` e `carregando` são signals porque chegam de forma assíncrona —
// no modo zoneless, só o signal avisa o Angular para redesenhar a tela.
//
// Mudanças de 24/09: matéria como etiqueta da área (antes era texto azul, e
// azul é a cor do que é tocável); "Acertei" e "Errei" com ícone e texto; no
// fim, os cartões errados viram atalho para tirar a dúvida no Ask IA.

import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Flashcard, RevisaoService } from '../../services/revisao.service';
import { NOME_AREA, areaDaMateria, classeArea } from '../../core/areas';
import { Icone } from '../../shared/icone';

@Component({
  selector: 'app-flashcards',
  standalone: true,
  imports: [RouterLink, Icone],
  templateUrl: './flashcards.html',
  styleUrl: './flashcards.css',
  host: { class: 'pagina' },
})
export class Flashcards implements OnInit {
  private revisao = inject(RevisaoService);

  cartoes = signal<Flashcard[]>([]);
  carregando = signal(true);
  erro = signal('');

  indice = signal(0);
  virado = signal(false);
  acertos = signal(0);
  errados = signal<Flashcard[]>([]);
  terminou = signal(false);

  atual = computed<Flashcard | null>(() => this.cartoes()[this.indice()] ?? null);
  area = computed(() => areaDaMateria(this.atual()?.materia));
  classe = computed(() => classeArea(this.area()));
  nomeArea = computed(() => {
    const area = this.area();
    return area ? NOME_AREA[area] : '';
  });

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
    const cartao = this.atual();
    if (acertou) this.acertos.update(n => n + 1);
    else if (cartao) this.errados.update(lista => [...lista, cartao]);

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
    this.errados.set([]);
    this.terminou.set(false);
  }

  perguntaSobre(cartao: Flashcard): string {
    return `${cartao.frente} Me explique com um exemplo.`;
  }
}
