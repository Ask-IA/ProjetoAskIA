// src/app/pages/ask-ia/limite-diario.ts
//
// Aviso de limite diário atingido. Explica a causa (camada gratuita da IA, não
// cobrança), diz quando volta e oferece o próximo passo clicável — antes a
// tela terminava num "que tal revisar seus flashcards?" que não era link.
//
// Duas formas:
// - cartão grande, quando a conversa está vazia;
// - faixa compacta no lugar do campo, quando há conversa na tela. Ler o que
//   a IA já respondeu não gasta cota, então a conversa continua visível.

import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icone } from '../../shared/icone';

@Component({
  selector: 'app-limite-diario',
  imports: [RouterLink, Icone],
  template: `
    @if (compacto()) {
      <div class="faixa" role="status">
        <app-icone nome="ampulheta" [tamanho]="22" />
        <p>
          <b>Você usou as {{ cotaTotal() }} perguntas de hoje.</b>
          A cota volta à meia-noite ({{ horarioReinicio() }}). Dá para reler as conversas à vontade.
        </p>
        <a routerLink="/app/flashcards" class="btn-contorno">Revisar flashcards</a>
      </div>
    } @else {
      <div class="cartao-app limite">
        <app-icone nome="ampulheta" [tamanho]="36" />
        <h2>Você usou suas {{ cotaTotal() }} perguntas de hoje</h2>
        <p>
          O Ask.IA é gratuito. O limite diário existe por causa da camada gratuita da IA
          que usamos, não é cobrança.
        </p>
        <p class="reinicio">Sua cota volta à meia-noite ({{ horarioReinicio() }}).</p>
        <div class="acoes">
          <a routerLink="/app/flashcards" class="btn-acento">Revisar flashcards</a>
          <a routerLink="/app/quiz" class="btn-contorno">Fazer um quiz</a>
        </div>
      </div>
    }
  `,
  styles: `
    .limite { display: flex; flex-direction: column; align-items: center; gap: 8px; margin-top: 24px; padding: 40px 24px; text-align: center; }
    h2 { margin: 8px 0 0; font-size: 1.25rem; font-weight: 700; }
    .limite p { max-width: 46ch; color: var(--texto-suave); }
    .limite .reinicio { color: var(--texto); font-weight: 600; }
    .acoes { display: flex; flex-wrap: wrap; justify-content: center; gap: 10px; margin-top: 12px; }
    .faixa {
      display: flex; flex-wrap: wrap; align-items: center; gap: 10px 14px;
      max-width: 680px; margin: 0 auto; padding: 4px 0;
    }
    .faixa p { flex: 1 1 240px; color: var(--texto-suave); font-size: .9375rem; line-height: 1.45; }
    .faixa b { color: var(--texto); }
  `,
})
export class LimiteDiario {
  readonly cotaTotal = input.required<number>();
  readonly horarioReinicio = input.required<string>();
  readonly compacto = input(false);
}
