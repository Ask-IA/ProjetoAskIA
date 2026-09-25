// src/app/pages/painel/painel.ts
//
// Painel do aluno — dados reais do backend (menos o que ainda é mock:
// conversas do Ask IA e flashcards).
//
// Redesenho de 24/09:
// - UM botão principal: "Continuar" a última conversa do Ask IA. Antes eram
//   quatro botões azuis iguais, e quando tudo é principal nada é principal.
// - Ofensiva com os últimos 7 dias, cartões para revisar e tempo da semana.
// - "Tópicos concluídos por área", nas cores das 4 áreas do ENEM.
//   O nome é honesto: o número vem dos tópicos marcados como concluídos, não
//   de acertos. Quando o Quiz guardar resultados (Fase 3), vira "Acertos por área".
// - "Onde focar agora" em cor neutra, com a ação ao lado. Antes a matéria mais
//   fraca aparecia em vermelho, a cor de erro do app.
//
// POR QUE SIGNALS: o projeto é zoneless (não existe zone.js). Sem zone.js, o
// Angular não percebe sozinho que uma variável mudou dentro de um subscribe;
// um signal avisa por conta própria.

import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { EstudosService, Materia, ResumoPainel } from '../../services/estudos.service';
import { Flashcard, RevisaoService } from '../../services/revisao.service';
import { AskIaService } from '../../services/ask-ia.service';
import { AREAS, AreaEnem, NOME_AREA, NOME_CURTO_AREA, areaDaMateria, classeArea } from '../../core/areas';
import { descreverQuando, duracaoPorExtenso, hojePorExtenso } from '../../core/datas';
import { Icone } from '../../shared/icone';
import { ContaAcoes } from '../../layout/conta-acoes/conta-acoes';

const ordemDaArea = (area: AreaEnem | null) => (area ? AREAS.indexOf(area) : AREAS.length);

const LETRA_DO_DIA = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const NOME_DO_DIA = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];

@Component({
  selector: 'app-painel',
  standalone: true,
  imports: [RouterLink, Icone, ContaAcoes],
  templateUrl: './painel.html',
  styleUrl: './painel.css',
  host: { class: 'pagina' },
})
export class Painel implements OnInit {
  private estudos = inject(EstudosService);
  private revisao = inject(RevisaoService);
  private auth = inject(AuthService);
  private askIa = inject(AskIaService);

  readonly hoje = hojePorExtenso();
  readonly classeArea = classeArea;
  readonly nomeArea = NOME_AREA;

  resumo = signal<ResumoPainel | null>(null);
  materias = signal<Materia[] | null>(null);
  ofensiva = signal<number | null>(null);
  cartoes = signal<Flashcard[]>([]);
  erro = signal('');

  /** Só o primeiro nome, para caber na saudação. */
  readonly nome = computed(() => this.auth.usuario()?.name?.split(' ')[0] ?? 'estudante');

  readonly ultimaConversa = computed(() => {
    const conversa = this.askIa.recentes()[0];
    return conversa ? { ...conversa, quando: descreverQuando(conversa.atualizadaEm) } : null;
  });

  /** Os últimos 7 dias, do mais antigo até hoje (mesma ordem do backend). */
  readonly semana = computed(() => {
    const dias = this.resumo()?.minutosPorDia ?? [];
    return dias.map((dia, i) => {
      const data = new Date();
      data.setDate(data.getDate() - (dias.length - 1 - i));
      const nomeDia = i === dias.length - 1 ? 'hoje' : NOME_DO_DIA[data.getDay()];
      return {
        letra: LETRA_DO_DIA[data.getDay()],
        estudou: dia.minutos > 0,
        hoje: i === dias.length - 1,
        minutos: dia.minutos,
        descricao: `${nomeDia}: ${dia.minutos > 0 ? duracaoPorExtenso(dia.minutos) : 'sem estudo'}`,
      };
    });
  });

  readonly maiorDiaDaSemana = computed(() => Math.max(1, ...this.semana().map(d => d.minutos)));

  readonly tempoSemana = computed(() => duracaoPorExtenso(this.resumo()?.minutosSemana ?? 0));

  readonly cartoesPorArea = computed(() => {
    const contagem = new Map<string, number>();
    for (const cartao of this.cartoes()) {
      const area = areaDaMateria(cartao.materia);
      const nome = area ? NOME_CURTO_AREA[area] : cartao.materia;
      contagem.set(nome, (contagem.get(nome) ?? 0) + 1);
    }
    return [...contagem.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([nome, total]) => `${total} de ${nome}`)
      .join(' · ');
  });

  /** Ordenadas pela área (na ordem da prova): matérias da mesma cor ficam juntas. */
  readonly suasMaterias = computed(() =>
    (this.materias() ?? [])
      .map(m => ({
        id: m.id,
        nome: m.nome,
        area: areaDaMateria(m.nome),
        feitos: m.topicos.filter(t => t.concluido).length,
        total: m.topicos.length,
      }))
      .sort((a, b) => ordemDaArea(a.area) - ordemDaArea(b.area))
  );

  readonly porArea = computed(() =>
    AREAS.map(area => {
      const daArea = this.suasMaterias().filter(m => m.area === area);
      const total = daArea.reduce((soma, m) => soma + m.total, 0);
      const feitos = daArea.reduce((soma, m) => soma + m.feitos, 0);
      return {
        area,
        nome: NOME_AREA[area],
        total,
        feitos,
        percentual: total === 0 ? 0 : Math.round((feitos / total) * 100),
      };
    })
  );

  /** A matéria com menor proporção de tópicos concluídos (e que ainda tem tópico pendente). */
  readonly ondeFocar = computed(() => {
    const candidatas = (this.materias() ?? [])
      .map(m => ({ materia: m, pendente: m.topicos.find(t => !t.concluido) }))
      .filter(c => c.pendente && c.materia.topicos.length > 0)
      .map(c => ({
        nome: c.materia.nome,
        area: areaDaMateria(c.materia.nome),
        topico: c.pendente!.nome,
        feitos: c.materia.topicos.filter(t => t.concluido).length,
        total: c.materia.topicos.length,
      }))
      .sort((a, b) => a.feitos / a.total - b.feitos / b.total || b.total - a.total);
    return candidatas[0] ?? null;
  });

  readonly carregando = computed(() => !this.erro() && (this.resumo() === null || this.materias() === null));

  ngOnInit(): void {
    this.carregar();
  }

  carregar(): void {
    this.erro.set('');
    const falhou = () => this.erro.set('Não foi possível carregar seu painel.');

    this.estudos.resumoPainel().subscribe({ next: r => this.resumo.set(r), error: falhou });
    this.estudos.listarMaterias().subscribe({ next: m => this.materias.set(m), error: falhou });
    // a ofensiva é um extra: se falhar, o cartão só mostra um traço
    this.estudos.ofensiva().subscribe({ next: dias => this.ofensiva.set(dias), error: () => this.ofensiva.set(null) });
    this.revisao.listarFlashcards().subscribe(lista => this.cartoes.set(lista));
  }

  perguntaSobre(foco: { topico: string; nome: string }): string {
    return `Me explique ${foco.topico} (${foco.nome}) com um exemplo`;
  }
}
