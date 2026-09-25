// src/app/shared/icone.ts
//
// Ícones do app, desenhados em SVG dentro do próprio código.
//
// Substitui duas coisas que davam problema:
// - os caracteres Unicode do menu (✦ ▦ ☰ ▤ ◧ ◔ ◈ ⎋): formas sem relação com a
//   função, e alguns nem aparecem em certos celulares (o ◔ do Quiz sumia);
// - o Lucide carregado por CDN na landing (mais um script externo na página).
//
// Uso: <app-icone nome="painel" />  ou  <app-icone nome="check" [tamanho]="18" />
// O ícone é sempre decorativo (aria-hidden): o texto ao lado, ou o aria-label
// do botão, é que diz o que ele significa.

import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type NomeIcone =
  | 'pergunta' | 'painel' | 'praticar' | 'plano' | 'quiz' | 'flashcards'
  | 'materias' | 'cronograma' | 'progresso' | 'lua' | 'sair' | 'mais'
  | 'historico' | 'ampulheta' | 'enviar' | 'fogo' | 'relogio' | 'seta-direita'
  | 'check' | 'x' | 'lixeira' | 'menu' | 'brilho' | 'logo' | 'olho'
  | 'olho-riscado' | 'presente' | 'capelo';

/** Traço mais grosso nos ícones pequenos de ação, mais fino na marca. */
const ESPESSURA: Partial<Record<NomeIcone, number>> = {
  logo: 1.6,
  mais: 2,
  enviar: 2,
  'seta-direita': 2,
  check: 2.2,
  x: 2.2,
  menu: 2,
  olho: 2,
  'olho-riscado': 2,
};

@Component({
  selector: 'app-icone',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg [attr.width]="tamanho()" [attr.height]="tamanho()" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" [attr.stroke-width]="espessura()" stroke-linecap="round"
         stroke-linejoin="round" aria-hidden="true" focusable="false">
      @switch (nome()) {
        @case ('pergunta') {
          <path d="M5 4.5h14A1.5 1.5 0 0 1 20.5 6v9a1.5 1.5 0 0 1-1.5 1.5h-8.6L6 20v-3.5H5A1.5 1.5 0 0 1 3.5 15V6A1.5 1.5 0 0 1 5 4.5z" />
          <path d="M10.1 8.7a2 2 0 1 1 2.7 1.9c-.5.2-.8.6-.8 1.1v.3" /><path d="M12 13.9v.1" />
        }
        @case ('painel') {
          <rect x="4" y="4" width="7" height="7" rx="1.6" /><rect x="13" y="4" width="7" height="7" rx="1.6" />
          <rect x="4" y="13" width="7" height="7" rx="1.6" /><rect x="13" y="13" width="7" height="7" rx="1.6" />
        }
        @case ('praticar') {
          <rect x="3.5" y="7.5" width="12.5" height="12.5" rx="2" /><path d="M7.5 4.5h10.5a2 2 0 0 1 2 2V17" />
          <path d="M6.8 13.8l2 2 3.6-4" />
        }
        @case ('plano') {
          <rect x="4" y="5.5" width="16" height="14.5" rx="2" /><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4M8 14h3" />
        }
        @case ('quiz') {
          <circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="4" /><circle cx="12" cy="12" r="0.6" />
        }
        @case ('flashcards') {
          <rect x="3.5" y="7.5" width="12.5" height="12.5" rx="2" /><path d="M7.5 4.5h10.5a2 2 0 0 1 2 2V17" />
        }
        @case ('materias') {
          <path d="M5 5a2 2 0 0 1 2-2h12v15H7a2 2 0 0 0-2 2z" /><path d="M5 20a2 2 0 0 0 2 1h12" />
        }
        @case ('cronograma') {
          <rect x="4" y="5.5" width="16" height="14.5" rx="2" /><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4" />
        }
        @case ('progresso') {
          <path d="M5 20v-6M10 20V9M15 20v-4M20 20V5" />
        }
        @case ('lua') {
          <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />
        }
        @case ('sair') {
          <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" /><path d="M10 16l-4-4 4-4" /><path d="M6 12h10" />
        }
        @case ('mais') {
          <path d="M12 5v14M5 12h14" />
        }
        @case ('historico') {
          <path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3" /><path d="M4.5 4.5v3.2h3.2" /><path d="M12 8.5V12l2.6 1.6" />
        }
        @case ('ampulheta') {
          <path d="M7 3.5h10M7 20.5h10" />
          <path d="M8 3.5c0 4.5 8 4.5 8 8.5s-8 4-8 8.5M16 3.5c0 4.5-8 4.5-8 8.5s8 4 8 8.5" />
        }
        @case ('enviar') {
          <path d="M12 19V5M6 11l6-6 6 6" />
        }
        @case ('fogo') {
          <path d="M12 3c1 3.5 5 5.5 5 10a5 5 0 0 1-10 0c0-2.5 1.5-4 2.5-5 .3 1.6 1.2 2.6 2.5 3 0-3-1-5.5 0-8z" />
        }
        @case ('relogio') {
          <circle cx="12" cy="12" r="8" /><path d="M12 7.5V12l3 2" />
        }
        @case ('seta-direita') {
          <path d="M5 12h14M13 6l6 6-6 6" />
        }
        @case ('check') {
          <path d="M5 12.5l4.5 4.5L19 7.5" />
        }
        @case ('x') {
          <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />
        }
        @case ('lixeira') {
          <path d="M4 7h16" /><path d="M10 11v6M14 11v6" />
          <path d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12" />
          <path d="M9 7V4.5A1.5 1.5 0 0 1 10.5 3h3A1.5 1.5 0 0 1 15 4.5V7" />
        }
        @case ('menu') {
          <path d="M4 7h16M4 12h16M4 17h16" />
        }
        @case ('brilho') {
          <path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z" />
          <path d="M19 15l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z" />
        }
        @case ('logo') {
          <circle cx="12" cy="12" r="2.2" /><circle cx="4" cy="6" r="1.6" /><circle cx="20" cy="6" r="1.6" />
          <circle cx="4" cy="18" r="1.6" /><circle cx="20" cy="18" r="1.6" />
          <line x1="10.3" y1="10.6" x2="5.2" y2="7.2" /><line x1="13.7" y1="10.6" x2="18.8" y2="7.2" />
          <line x1="10.3" y1="13.4" x2="5.2" y2="16.8" /><line x1="13.7" y1="13.4" x2="18.8" y2="16.8" />
        }
        @case ('olho') {
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
        }
        @case ('olho-riscado') {
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
          <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
          <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" />
        }
        @case ('presente') {
          <rect x="3.5" y="8.5" width="17" height="4" rx="1" /><path d="M5 12.5V20h14v-7.5" /><path d="M12 8.5V20" />
          <path d="M12 8.5c-1.5-3-5-3.5-5.5-1.5S9 8.5 12 8.5zM12 8.5c1.5-3 5-3.5 5.5-1.5S15 8.5 12 8.5z" />
        }
        @case ('capelo') {
          <path d="M2.5 9.5 12 5l9.5 4.5L12 14z" /><path d="M6.5 11.5V16c0 1.4 2.5 3 5.5 3s5.5-1.6 5.5-3v-4.5" />
          <path d="M21.5 9.5v5" />
        }
      }
    </svg>
  `,
  styles: `:host { display: inline-flex; flex-shrink: 0; line-height: 0; }`,
})
export class Icone {
  readonly nome = input.required<NomeIcone>();
  readonly tamanho = input(20);

  protected readonly espessura = computed(() => ESPESSURA[this.nome()] ?? 1.8);
}
