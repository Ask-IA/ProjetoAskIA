// src/app/services/revisao.service.ts
//
// Duas fontes de flashcards e quiz:
// 1) GERADOS PELA IA (OpenAI/Gemini, via backend), a partir das matérias e
//    tópicos que o próprio aluno cadastrou em Matérias — POST .../revisao/
//    flashcards|quiz. Nada fica guardado entre uma geração e outra.
// 2) BANCO CURADO PELA EQUIPE (sem IA) — GET /api/banco/flashcards|questoes,
//    filtrado pelo NOME da matéria. Existe para o aluno praticar mesmo sem
//    IA disponível (sem chave configurada, cota do dia esgotada, ou o
//    provedor fora do ar). Ver db/06_banco_conteudo.sql.

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Flashcard {
  id: number;
  materia: string;
  frente: string;
  verso: string;
}

export interface QuestaoQuiz {
  enunciado: string;
  alternativas: string[];
  correta: number; // índice da alternativa correta
  /** Uma linha dizendo POR QUE a certa é a certa. */
  explicacao?: string;
}

interface FlashcardApi {
  materia: string;
  frente: string;
  verso: string;
}

/** Envelope de POST .../revisao/flashcards|quiz — ver ResultadoGeracaoDTO no backend. */
interface ResultadoGeracaoApi<T> {
  itens: T[];
  /** true = a IA falhou (sem chave, cota da conta, erro de rede) e isto veio do banco curado, como fallback automático. */
  doBanco: boolean;
}

export interface ResultadoGeracao<T> {
  itens: T[];
  doBanco: boolean;
}

@Injectable({ providedIn: 'root' })
export class RevisaoService {
  private http = inject(HttpClient);
  private readonly api = `${environment.apiUrl}/api/materias`;

  /**
   * Pede à IA um lote novo de flashcards para a matéria (cobrindo os tópicos já cadastrados
   * nela). Se a IA falhar, o backend cai sozinho no banco curado — `doBanco` avisa qual das duas
   * fontes voltou desta vez, pra tela informar o aluno.
   */
  gerarFlashcards(materiaId: number): Observable<ResultadoGeracao<Flashcard>> {
    return this.http.post<ResultadoGeracaoApi<FlashcardApi>>(`${this.api}/${materiaId}/revisao/flashcards`, {}).pipe(
      map(resultado => ({
        doBanco: resultado.doBanco,
        itens: resultado.itens.map((c, indice) => ({ id: indice, materia: c.materia, frente: c.frente, verso: c.verso })),
      }))
    );
  }

  /**
   * Pede à IA um quiz novo para a matéria (cobrindo os tópicos já cadastrados nela). Se a IA
   * falhar, o backend cai sozinho no banco curado — `doBanco` avisa qual das duas fontes voltou.
   */
  gerarQuiz(materiaId: number): Observable<ResultadoGeracao<QuestaoQuiz>> {
    return this.http.post<ResultadoGeracaoApi<QuestaoQuiz>>(`${this.api}/${materiaId}/revisao/quiz`, {}).pipe(
      map(resultado => ({ doBanco: resultado.doBanco, itens: resultado.itens }))
    );
  }

  /** Flashcards do banco curado (sem IA) para o NOME da matéria. Lista vazia = ainda não há banco para ela. */
  flashcardsDoBanco(nomeMateria: string): Observable<Flashcard[]> {
    return this.http.get<FlashcardApi[]>(`${this.api.replace('/materias', '/banco')}/flashcards`, {
      params: { materia: nomeMateria },
    }).pipe(
      map(lista => lista.map((c, indice) => ({ id: indice, materia: c.materia, frente: c.frente, verso: c.verso })))
    );
  }

  /** Quiz do banco curado (sem IA) para o NOME da matéria. Lista vazia = ainda não há banco para ela. */
  quizDoBanco(nomeMateria: string): Observable<QuestaoQuiz[]> {
    return this.http.get<QuestaoQuiz[]>(`${this.api.replace('/materias', '/banco')}/questoes`, {
      params: { materia: nomeMateria },
    });
  }
}
