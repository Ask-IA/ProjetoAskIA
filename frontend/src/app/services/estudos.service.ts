// src/app/services/estudos.service.ts
//
// Matérias, Cronograma, Painel e Progresso — agora falando com o backend real.
//
// Antes este arquivo era um mock (arrays em memória + delay). As assinaturas
// dos métodos foram mantidas IGUAIS de propósito: os componentes não mudaram.
// Todo endpoint aqui vive em /api/** e exige sessão; o cookie vai sozinho
// (credenciaisInterceptor) e um 401 manda o usuário de volta ao login.

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';

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
  /** Data/hora em texto ISO, como vem do backend (ex.: 2026-09-16T20:15:00). */
  data: string;
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

export interface Progresso {
  ofensiva: number;
  desempenhos: DesempenhoMateria[];
}

@Injectable({ providedIn: 'root' })
export class EstudosService {
  private http = inject(HttpClient);
  private readonly api = `${environment.apiUrl}/api`;

  // ---------- Matérias ----------

  listarMaterias(): Observable<Materia[]> {
    return this.http.get<Materia[]>(`${this.api}/materias`);
  }

  adicionarMateria(nome: string): Observable<Materia> {
    return this.http.post<Materia>(`${this.api}/materias`, { nome });
  }

  adicionarTopico(materiaId: number, nome: string): Observable<Topico> {
    return this.http.post<Topico>(`${this.api}/materias/${materiaId}/topicos`, { nome });
  }

  alternarTopico(materiaId: number, topicoId: number): Observable<void> {
    return this.http.patch<void>(`${this.api}/materias/${materiaId}/topicos/${topicoId}/alternar`, {});
  }

  removerTopico(materiaId: number, topicoId: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/materias/${materiaId}/topicos/${topicoId}`);
  }

  // ---------- Cronograma ----------

  listarMetas(): Observable<Meta[]> {
    return this.http.get<Meta[]>(`${this.api}/metas`);
  }

  adicionarMeta(meta: Omit<Meta, 'id'>): Observable<Meta> {
    return this.http.post<Meta>(`${this.api}/metas`, meta);
  }

  removerMeta(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/metas/${id}`);
  }

  listarSessoes(): Observable<SessaoEstudo[]> {
    return this.http.get<SessaoEstudo[]>(`${this.api}/sessoes`);
  }

  registrarSessao(sessao: Omit<SessaoEstudo, 'id' | 'data'>): Observable<SessaoEstudo> {
    return this.http.post<SessaoEstudo>(`${this.api}/sessoes`, sessao);
  }

  // ---------- Resumos (Painel e Progresso) ----------

  resumoPainel(): Observable<ResumoPainel> {
    return this.http.get<ResumoPainel>(`${this.api}/painel`);
  }

  progresso(): Observable<Progresso> {
    return this.http.get<Progresso>(`${this.api}/progresso`);
  }

  desempenhoPorMateria(): Observable<DesempenhoMateria[]> {
    return this.progresso().pipe(map(p => p.desempenhos));
  }

  ofensiva(): Observable<number> {
    return this.progresso().pipe(map(p => p.ofensiva));
  }
}
