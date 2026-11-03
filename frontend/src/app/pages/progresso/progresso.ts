// src/app/pages/progresso/progresso.ts
//
// Ofensiva (dias seguidos estudando), tópicos concluídos e minutos por matéria.
// Usa signals pelo mesmo motivo do Painel: o app é zoneless, e só o signal
// avisa o Angular para redesenhar a tela quando o dado chega.
//
// Cor de cada barra = cor da ÁREA da matéria (antes: cor da matéria, que
// reaproveitava vermelho de erro e verde de acerto). E a área vai escrita.

import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Conquista, DesempenhoMateria, EstudosService } from '../../services/estudos.service';
import { AREAS, AreaEnem, NOME_CURTO_AREA, areaDaMateria, classeArea } from '../../core/areas';
import { duracaoPorExtenso } from '../../core/datas';
import { Icone } from '../../shared/icone';

interface LinhaMateria extends DesempenhoMateria {
  area: AreaEnem | null;
  nomeArea: string;
}

@Component({
  selector: 'app-progresso',
  standalone: true,
  imports: [Icone],
  templateUrl: './progresso.html',
  styleUrl: './progresso.css',
  host: { class: 'pagina' },
})
export class Progresso implements OnInit {
  private estudos = inject(EstudosService);

  readonly classeArea = classeArea;

  ofensiva = signal(0);
  desempenhos = signal<DesempenhoMateria[]>([]);
  carregando = signal(true);
  erro = signal('');

  // Gamificação (XP, perguntas respondidas, conquistas) — GET /api/gamificacao e
  // /api/conquistas. Carregada à parte do resto: se falhar, só essa seção some,
  // o progresso por matéria continua aparecendo normalmente.
  xp = signal(0);
  perguntasRespondidas = signal(0);
  conquistas = signal<Conquista[]>([]);

  /** Matérias com a área, ordenadas na ordem da prova (as da mesma cor ficam juntas). */
  readonly linhas = computed<LinhaMateria[]>(() =>
    this.desempenhos()
      .map(d => {
        const area = areaDaMateria(d.materia);
        return { ...d, area, nomeArea: area ? NOME_CURTO_AREA[area] : 'Sem área' };
      })
      .sort((a, b) => ordem(a.area) - ordem(b.area))
  );

  /** Recalculado sozinho sempre que `desempenhos` muda. */
  readonly totalMinutos = computed(() =>
    this.desempenhos().reduce((soma, d) => soma + d.minutos, 0)
  );
  readonly totalPorExtenso = computed(() => duracaoPorExtenso(this.totalMinutos()));

  ngOnInit(): void {
    this.carregar();
    this.carregarGamificacao();
  }

  carregar(): void {
    this.carregando.set(true);
    this.erro.set('');

    this.estudos.progresso().subscribe({
      next: p => {
        this.ofensiva.set(p.ofensiva);
        this.desempenhos.set(p.desempenhos);
        this.carregando.set(false);
      },
      error: () => {
        this.carregando.set(false);
        this.erro.set('Não foi possível carregar seu progresso.');
      },
    });
  }

  private carregarGamificacao(): void {
    this.estudos.gamificacao().subscribe({
      next: g => {
        this.xp.set(g.xp);
        this.perguntasRespondidas.set(g.perguntasRespondidas);
      },
      error: () => {}, // silencioso: o cartão de XP só não aparece
    });
    this.estudos.conquistas().subscribe({
      next: c => this.conquistas.set(c),
      error: () => {}, // silencioso: a seção de conquistas só não aparece
    });
  }

  larguraMinutos(minutos: number): number {
    const maximo = Math.max(...this.desempenhos().map(d => d.minutos), 1);
    return Math.round((minutos / maximo) * 100);
  }

  duracao(minutos: number): string {
    return duracaoPorExtenso(minutos);
  }
}

function ordem(area: AreaEnem | null): number {
  return area ? AREAS.indexOf(area) : AREAS.length;
}
