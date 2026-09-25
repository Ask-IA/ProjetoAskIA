// src/app/core/tema.service.ts
//
// Modo claro e modo escuro.
//
// Quem escolhe o modo na abertura é o script do index.html (antes do Angular,
// para não piscar). Este serviço só LÊ o que o script decidiu e cuida da troca
// feita pelo aluno no botão "Modo escuro".
//
// A troca é um único atributo: <html data-tema="escuro">. Todas as cores do
// app são variáveis CSS (styles.css), então o resto acontece sozinho.
//
// Signal pelo mesmo motivo do resto do app: é zoneless, e o signal é o que
// avisa o Angular para redesenhar o interruptor.

import { DOCUMENT } from '@angular/common';
import { Injectable, computed, inject, signal } from '@angular/core';

export type Tema = 'claro' | 'escuro';

const CHAVE = 'askia-tema';

@Injectable({ providedIn: 'root' })
export class TemaService {
  private readonly raiz = inject(DOCUMENT).documentElement;

  readonly tema = signal<Tema>(this.raiz.dataset['tema'] === 'escuro' ? 'escuro' : 'claro');
  readonly escuro = computed(() => this.tema() === 'escuro');

  constructor() {
    // Enquanto o aluno não escolher, o app acompanha o aparelho — inclusive
    // se ele mudar o modo do celular com o app aberto.
    const preferencia = window.matchMedia?.('(prefers-color-scheme: dark)');
    preferencia?.addEventListener('change', evento => {
      if (!this.temEscolhaSalva()) {
        this.aplicar(evento.matches ? 'escuro' : 'claro');
      }
    });
  }

  alternar(): void {
    this.definir(this.escuro() ? 'claro' : 'escuro');
  }

  definir(tema: Tema): void {
    this.aplicar(tema);
    try {
      localStorage.setItem(CHAVE, tema);
    } catch {
      // navegador com armazenamento bloqueado: o modo vale só nesta visita
    }
  }

  private aplicar(tema: Tema): void {
    this.raiz.dataset['tema'] = tema;
    this.tema.set(tema);
  }

  private temEscolhaSalva(): boolean {
    try {
      return localStorage.getItem(CHAVE) !== null;
    } catch {
      return false;
    }
  }
}
