// src/app/services/estudos.service.ts
//
// DADOS FALSOS (mock) para Matérias, Cronograma, Painel e Progresso.
//
// Contrato de integração: os componentes consomem SEMPRE Observables,
// como se fosse HTTP de verdade (inclusive com um pequeno delay para
// simular rede). Quando o backend expuser os endpoints reais, a troca
// acontece SÓ AQUI DENTRO — os componentes não mudam.
//
// TODO (integração): substituir os arrays em memória por chamadas
// HttpClient aos endpoints do backend quando o Jorge os criar.

import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

export interface Topico {
  id: number;
  nome: string;
  concluido: boolean;
}

export interface Materia {
  id: number;
  nome: string;
  cor: string;
  topicos: Topico[];
}

export type DiaSemana = 'Domingo' | 'Segunda' | 'Terça' | 'Quarta' | 'Quinta' | 'Sexta' | 'Sábado';

export interface Meta {
  id: number;
  materiaId: number;
  dia: DiaSemana;
  hora: string;
  descricao?: string;
}

export interface SessaoEstudo {
  id: number;
  materiaId: number;
  minutos: number;
  anotacoes?: string;
  data: Date;
}

export interface ResumoPainel {
  minutosTotais: number;
  minutosSemana: number;
  topicosConcluidos: number;
  totalMaterias: number;
  minutosPorDia: { rotulo: string; minutos: number }[];
  maiorDesempenho: { materia: string; percentual: number } | null;
  menorDesempenho: { materia: string; percentual: number } | null;
}

export interface DesempenhoMateria {
  materia: string;
  cor: string;
  percentual: number;
  minutos: number;
}

const ATRASO_REDE = 250; // ms — simula latência para os componentes já lidarem com async

@Injectable({ providedIn: 'root' })
export class EstudosService {
  private proximoId = 100;

  private materias: Materia[] = [
    {
      id: 1, nome: 'Matemática', cor: '#1D4ED8',
      topicos: [
        { id: 11, nome: 'Função Afim', concluido: true },
        { id: 12, nome: 'Função Quadrática', concluido: false },
        { id: 13, nome: 'Porcentagem', concluido: true },
      ],
    },
    {
      id: 2, nome: 'Português', cor: '#DC2626',
      topicos: [
        { id: 21, nome: 'Interpretação de texto', concluido: true },
        { id: 22, nome: 'Crase', concluido: false },
      ],
    },
    {
      id: 3, nome: 'Geografia', cor: '#16A34A',
      topicos: [
        { id: 31, nome: 'Urbanização', concluido: false },
      ],
    },
    {
      id: 4, nome: 'História', cor: '#F59E0B',
      topicos: [
        { id: 41, nome: 'Era Vargas', concluido: true },
        { id: 42, nome: 'República Velha', concluido: false },
      ],
    },
  ];

  private metas: Meta[] = [
    { id: 51, materiaId: 1, dia: 'Segunda', hora: '19:00', descricao: 'Revisar função afim' },
    { id: 52, materiaId: 2, dia: 'Quarta', hora: '20:00', descricao: 'Exercícios de crase' },
  ];

  private sessoes: SessaoEstudo[] = [
    { id: 61, materiaId: 1, minutos: 40, anotacoes: 'Lista de exercícios', data: this.diasAtras(1) },
    { id: 62, materiaId: 2, minutos: 25, data: this.diasAtras(2) },
    { id: 63, materiaId: 1, minutos: 30, anotacoes: 'Videoaula', data: this.diasAtras(3) },
    { id: 64, materiaId: 4, minutos: 20, data: this.diasAtras(5) },
  ];

  // ---------- Matérias ----------

  listarMaterias(): Observable<Materia[]> {
    return of(this.clonar(this.materias)).pipe(delay(ATRASO_REDE));
  }

  adicionarMateria(nome: string): Observable<Materia> {
    const cores = ['#1D4ED8', '#DC2626', '#16A34A', '#F59E0B', '#7C3AED', '#0891B2'];
    const nova: Materia = {
      id: this.proximoId++,
      nome,
      cor: cores[this.materias.length % cores.length],
      topicos: [],
    };
    this.materias.push(nova);
    return of(this.clonar(nova)).pipe(delay(ATRASO_REDE));
  }

  adicionarTopico(materiaId: number, nome: string): Observable<Topico> {
    const materia = this.materias.find(m => m.id === materiaId);
    const novo: Topico = { id: this.proximoId++, nome, concluido: false };
    materia?.topicos.push(novo);
    return of({ ...novo }).pipe(delay(ATRASO_REDE));
  }

  alternarTopico(materiaId: number, topicoId: number): Observable<void> {
    const topico = this.materias
      .find(m => m.id === materiaId)?.topicos
      .find(t => t.id === topicoId);
    if (topico) topico.concluido = !topico.concluido;
    return of(void 0).pipe(delay(ATRASO_REDE));
  }

  removerTopico(materiaId: number, topicoId: number): Observable<void> {
    const materia = this.materias.find(m => m.id === materiaId);
    if (materia) materia.topicos = materia.topicos.filter(t => t.id !== topicoId);
    return of(void 0).pipe(delay(ATRASO_REDE));
  }

  // ---------- Cronograma ----------

  listarMetas(): Observable<Meta[]> {
    return of(this.clonar(this.metas)).pipe(delay(ATRASO_REDE));
  }

  adicionarMeta(meta: Omit<Meta, 'id'>): Observable<Meta> {
    const nova: Meta = { ...meta, id: this.proximoId++ };
    this.metas.push(nova);
    return of({ ...nova }).pipe(delay(ATRASO_REDE));
  }

  removerMeta(id: number): Observable<void> {
    this.metas = this.metas.filter(m => m.id !== id);
    return of(void 0).pipe(delay(ATRASO_REDE));
  }

  listarSessoes(): Observable<SessaoEstudo[]> {
    const ordenadas = [...this.sessoes].sort((a, b) => b.data.getTime() - a.data.getTime());
    return of(this.clonar(ordenadas)).pipe(delay(ATRASO_REDE));
  }

  registrarSessao(sessao: Omit<SessaoEstudo, 'id' | 'data'>): Observable<SessaoEstudo> {
    const nova: SessaoEstudo = { ...sessao, id: this.proximoId++, data: new Date() };
    this.sessoes.push(nova);
    return of(this.clonar(nova)).pipe(delay(ATRASO_REDE));
  }

  // ---------- Resumos (Painel e Progresso) ----------

  resumoPainel(): Observable<ResumoPainel> {
    const minutosTotais = this.sessoes.reduce((soma, s) => soma + s.minutos, 0);
    const seteDiasAtras = this.diasAtras(7);
    const minutosSemana = this.sessoes
      .filter(s => s.data >= seteDiasAtras)
      .reduce((soma, s) => soma + s.minutos, 0);

    const topicosConcluidos = this.materias
      .flatMap(m => m.topicos)
      .filter(t => t.concluido).length;

    const desempenhos = this.desempenhos();
    const ordenado = [...desempenhos].sort((a, b) => b.percentual - a.percentual);

    return of({
      minutosTotais,
      minutosSemana,
      topicosConcluidos,
      totalMaterias: this.materias.length,
      minutosPorDia: this.minutosUltimos7Dias(),
      maiorDesempenho: ordenado[0]
        ? { materia: ordenado[0].materia, percentual: ordenado[0].percentual }
        : null,
      menorDesempenho: ordenado.length > 1
        ? { materia: ordenado[ordenado.length - 1].materia, percentual: ordenado[ordenado.length - 1].percentual }
        : null,
    }).pipe(delay(ATRASO_REDE));
  }

  desempenhoPorMateria(): Observable<DesempenhoMateria[]> {
    return of(this.desempenhos()).pipe(delay(ATRASO_REDE));
  }

  /** Dias seguidos com pelo menos uma sessão registrada (ofensiva). */
  ofensiva(): Observable<number> {
    let dias = 0;
    for (let i = 0; i < 30; i++) {
      const dia = this.diasAtras(i);
      const temSessao = this.sessoes.some(s => this.mesmoDia(s.data, dia));
      if (temSessao) dias++;
      else if (i > 0) break; // hoje sem sessão ainda não quebra a sequência
    }
    return of(dias).pipe(delay(ATRASO_REDE));
  }

  // ---------- auxiliares ----------

  private desempenhos(): DesempenhoMateria[] {
    return this.materias.map(m => {
      const total = m.topicos.length;
      const feitos = m.topicos.filter(t => t.concluido).length;
      const minutos = this.sessoes
        .filter(s => s.materiaId === m.id)
        .reduce((soma, s) => soma + s.minutos, 0);
      return {
        materia: m.nome,
        cor: m.cor,
        percentual: total === 0 ? 0 : Math.round((feitos / total) * 100),
        minutos,
      };
    });
  }

  private minutosUltimos7Dias(): { rotulo: string; minutos: number }[] {
    const resultado: { rotulo: string; minutos: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const dia = this.diasAtras(i);
      const minutos = this.sessoes
        .filter(s => this.mesmoDia(s.data, dia))
        .reduce((soma, s) => soma + s.minutos, 0);
      const rotulo = `${String(dia.getDate()).padStart(2, '0')}/${String(dia.getMonth() + 1).padStart(2, '0')}`;
      resultado.push({ rotulo, minutos });
    }
    return resultado;
  }

  private diasAtras(n: number): Date {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - n);
    return d;
  }

  private mesmoDia(a: Date, b: Date): boolean {
    return a.getFullYear() === b.getFullYear()
      && a.getMonth() === b.getMonth()
      && a.getDate() === b.getDate();
  }

  private clonar<T>(valor: T): T {
    return structuredClone(valor);
  }
}
