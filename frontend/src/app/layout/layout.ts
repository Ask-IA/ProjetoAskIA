// src/app/layout/layout.ts
//
// Esqueleto compartilhado pelas sete seções da aplicação.
// O menu fica aqui; cada seção entra pelo <router-outlet> como filha.
//
// DOIS MENUS, UMA LISTA DE SEÇÕES
// - Computador: menu lateral com as 7 seções, agrupadas em Praticar e Plano.
// - Celular: barra de baixo com 5 destinos. Antes eram 8 itens (7 + Sair)
//   numa tela de 360 px: precisavam de 423 px, então Progresso e Sair ficavam
//   fora da tela. O Material 3 recomenda de 3 a 5 destinos.
//   Praticar = Quiz IA + Flashcards; Plano = Matérias + Cronograma. Dentro
//   desses dois, abas no topo da tela trocam entre as duas seções.
//   Sair e Modo escuro ficam no botão de conta, no topo do Painel.

import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { Icone, NomeIcone } from '../shared/icone';
import { ContaAcoes } from './conta-acoes/conta-acoes';

interface ItemMenu {
  rotulo: string;
  rota: string;
  icone: NomeIcone;
}

interface GrupoMenu {
  rotulo?: string;
  itens: ItemMenu[];
}

type NomeGrupo = 'praticar' | 'plano';

const ASK: ItemMenu        = { rotulo: 'Ask IA',     rota: '/app/ask',        icone: 'pergunta' };
const PAINEL: ItemMenu     = { rotulo: 'Painel',     rota: '/app/painel',     icone: 'painel' };
const QUIZ: ItemMenu       = { rotulo: 'Quiz IA',    rota: '/app/quiz',       icone: 'quiz' };
const FLASHCARDS: ItemMenu = { rotulo: 'Flashcards', rota: '/app/flashcards', icone: 'flashcards' };
const MATERIAS: ItemMenu   = { rotulo: 'Matérias',   rota: '/app/materias',   icone: 'materias' };
const CRONOGRAMA: ItemMenu = { rotulo: 'Cronograma', rota: '/app/cronograma', icone: 'cronograma' };
const PROGRESSO: ItemMenu  = { rotulo: 'Progresso',  rota: '/app/progresso',  icone: 'progresso' };

const GRUPOS: Record<NomeGrupo, { rotulo: string; icone: NomeIcone; abas: ItemMenu[] }> = {
  praticar: { rotulo: 'Praticar', icone: 'praticar', abas: [QUIZ, FLASHCARDS] },
  plano:    { rotulo: 'Plano',    icone: 'plano',    abas: [MATERIAS, CRONOGRAMA] },
};

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet, Icone, ContaAcoes],
  templateUrl: './layout.html',
  styleUrl: './layout.css',
})
export class Layout {
  private router = inject(Router);

  // Ask IA vem primeiro: a ordem do menu comunica a prioridade do produto.
  readonly gruposComputador: GrupoMenu[] = [
    { itens: [ASK, PAINEL] },
    { rotulo: 'Praticar', itens: [QUIZ, FLASHCARDS] },
    { rotulo: 'Plano', itens: [MATERIAS, CRONOGRAMA] },
    { itens: [PROGRESSO] },
  ];

  /** URL atual, como signal, para marcar o destino ativo da barra do celular. */
  private readonly url = toSignal(
    this.router.events.pipe(
      filter((evento): evento is NavigationEnd => evento instanceof NavigationEnd),
      map(evento => evento.urlAfterRedirects)
    ),
    { initialValue: this.router.url }
  );

  /** Última seção aberta em cada grupo: tocar em "Praticar" volta para ela. */
  private readonly ultimaDoGrupo = signal<Record<NomeGrupo, string>>({
    praticar: QUIZ.rota,
    plano: MATERIAS.rota,
  });

  readonly grupoAtual = computed(() => {
    const nome = this.grupoDaUrl(this.url());
    return nome ? GRUPOS[nome] : null;
  });

  readonly destinosCelular = computed(() => {
    const url = this.url();
    const grupo = this.grupoDaUrl(url);
    const ultima = this.ultimaDoGrupo();

    return [
      { ...ASK, ativo: url.startsWith(ASK.rota) },
      { ...PAINEL, ativo: url.startsWith(PAINEL.rota) },
      { rotulo: GRUPOS.praticar.rotulo, icone: GRUPOS.praticar.icone, rota: ultima.praticar, ativo: grupo === 'praticar' },
      { rotulo: GRUPOS.plano.rotulo, icone: GRUPOS.plano.icone, rota: ultima.plano, ativo: grupo === 'plano' },
      { ...PROGRESSO, ativo: url.startsWith(PROGRESSO.rota) },
    ];
  });

  constructor() {
    this.router.events
      .pipe(
        filter((evento): evento is NavigationEnd => evento instanceof NavigationEnd),
        takeUntilDestroyed() // ao sair do app (Sair), a inscrição acaba junto
      )
      .subscribe(evento => {
        const grupo = this.grupoDaUrl(evento.urlAfterRedirects);
        if (grupo) {
          const rota = evento.urlAfterRedirects.split('?')[0];
          this.ultimaDoGrupo.update(atual => ({ ...atual, [grupo]: rota }));
        }
      });
  }

  private grupoDaUrl(url: string): NomeGrupo | null {
    for (const nome of Object.keys(GRUPOS) as NomeGrupo[]) {
      if (GRUPOS[nome].abas.some(aba => url.startsWith(aba.rota))) return nome;
    }
    return null;
  }
}
