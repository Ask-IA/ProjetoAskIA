// src/app/pages/ask-ia/lista-conversas/lista-conversas.ts
//
// Conversas recentes do Ask IA. Aparece no canto direito em tela larga e no
// painel do botão de histórico no celular. Cada item mostra o ponto da área
// e o nome da área escrito (a cor sozinha não informa nada).

import { Component, input, output } from '@angular/core';
import { Conversa } from '../../../services/ask-ia.service';
import { AreaEnem, NOME_CURTO_AREA, classeArea } from '../../../core/areas';
import { descreverQuando } from '../../../core/datas';

@Component({
  selector: 'app-lista-conversas',
  template: `
    <ul class="conversas">
      @for (item of conversas(); track item.id) {
        <li>
          <button type="button" class="conversa-item" [class]="classeArea(item.area)"
                  [class.atual]="item.id === atualId()"
                  [attr.aria-current]="item.id === atualId() ? 'true' : null"
                  (click)="abrir.emit(item.id)">
            <span class="ponto-area"></span>
            <span class="texto">
              <b>{{ item.titulo }}</b>
              <small>{{ nomeDaArea(item.area) }} · {{ quando(item.atualizadaEm) }}</small>
            </span>
          </button>
        </li>
      } @empty {
        <li class="aviso">Suas conversas vão aparecer aqui.</li>
      }
    </ul>
  `,
  styles: `
    .conversas { display: flex; flex-direction: column; gap: 4px; margin-top: 10px; }
    .conversa-item { display: flex; gap: 10px; width: 100%; padding: 10px 12px; border-radius: 12px; text-align: left; }
    .conversa-item:hover { background: color-mix(in srgb, var(--texto) 5%, transparent); }
    .conversa-item.atual { background: var(--fundo); }
    .ponto-area { margin-top: 6px; }
    .texto { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
    .texto b { overflow: hidden; font-size: .875rem; font-weight: 600; text-overflow: ellipsis; white-space: nowrap; }
    .texto small { color: var(--texto-suave); font-size: .75rem; }
    .aviso { padding: 8px 12px; font-size: .875rem; }
  `,
})
export class ListaConversas {
  readonly conversas = input.required<Conversa[]>();
  readonly atualId = input<number | null>(null);
  readonly abrir = output<number>();

  readonly classeArea = classeArea;
  readonly quando = descreverQuando;

  nomeDaArea(area: AreaEnem | null): string {
    return area ? NOME_CURTO_AREA[area] : 'Geral';
  }
}
