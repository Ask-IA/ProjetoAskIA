// src/app/pages/rascunho/rascunho.ts
//
// Componente provisório. Existe só para as sete rotas responderem
// enquanto as telas reais não são escritas.
// Some assim que cada seção ganhar o próprio componente.

import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-rascunho',
  standalone: true,
  template: `
    <h1 style="margin:0 0 8px">{{ nome() }}</h1>
    <p style="color: var(--texto-suave); margin:0 0 24px">
      Seção ainda não construída.
    </p>

    <div style="background: var(--cartao); border-radius: var(--raio);
                box-shadow: var(--sombra); padding: 24px;">
      Conteúdo de <strong>{{ nome() }}</strong> entra aqui.
    </div>
  `,
})
export class Rascunho {
  private rota = inject(ActivatedRoute);

  nome(): string {
    const caminho = this.rota.snapshot.routeConfig?.path ?? '';
    const nomes: Record<string, string> = {
      ask: 'Ask IA',
      painel: 'Painel',
      materias: 'Matérias',
      cronograma: 'Cronograma',
      flashcards: 'Flashcards',
      quiz: 'Quiz IA',
      progresso: 'Progresso',
    };
    return nomes[caminho] ?? caminho;
  }
}