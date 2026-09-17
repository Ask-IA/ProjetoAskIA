// src/app/services/ask-ia.service.ts
//
// DADOS FALSOS (mock) do chat com a IA.
//
// Simula o contrato que o backend de IA (João) vai expor:
// - perguntar(): devolve a resposta em passos numerados, com atraso de rede
// - a cota de 10 perguntas/dia é controlada aqui e devolvida junto
// - cota esgotada => erro com status 429 (mesmo código que o backend usará)
//
// Para TESTAR o estado de erro na tela: digite exatamente "erro" como
// pergunta — o mock devolve uma falha 500 de propósito.
//
// TODO (integração): trocar por chamadas HttpClient ao endpoint do João
// (ex.: POST {environment.apiUrl}/ia/perguntar). A tela não muda.
// TODO (integração): decidir com a equipe a biblioteca de renderização de
// Markdown + fórmulas (ex.: ngx-markdown + KaTeX) quando a resposta real
// da IA chegar — o mock devolve texto puro em passos.

import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay, mergeMap } from 'rxjs/operators';

export interface PassoResposta {
  titulo: string;
  conteudo: string;
}

export interface RespostaIA {
  passos: PassoResposta[];
  cotaRestante: number;
}

export const COTA_DIARIA = 10;
const ATRASO_IA = 1400; // ms — a IA "pensando", para a tela exibir o carregando

@Injectable({ providedIn: 'root' })
export class AskIaService {
  private usadasHoje = 3; // começa com 3 usadas para o contador já mostrar algo

  cotaRestante(): Observable<number> {
    return of(COTA_DIARIA - this.usadasHoje).pipe(delay(200));
  }

  perguntar(pergunta: string): Observable<RespostaIA> {
    // Simulação de erro do servidor, para testar o estado de erro da tela
    if (pergunta.trim().toLowerCase() === 'erro') {
      return of(null).pipe(
        delay(ATRASO_IA),
        mergeMap(() => throwError(() => ({ status: 500, message: 'Erro simulado do servidor.' })))
      );
    }

    // Cota esgotada: mesmo comportamento previsto para o backend real
    if (this.usadasHoje >= COTA_DIARIA) {
      return of(null).pipe(
        delay(300),
        mergeMap(() => throwError(() => ({ status: 429, message: 'Limite diário atingido.' })))
      );
    }

    this.usadasHoje++;

    const resposta: RespostaIA = {
      cotaRestante: COTA_DIARIA - this.usadasHoje,
      passos: [
        {
          titulo: 'Entendendo a pergunta',
          conteudo: `Você perguntou: "${pergunta}". Vamos por partes, começando pelo conceito principal envolvido.`,
        },
        {
          titulo: 'Explicação do conceito',
          conteudo: 'Aqui entraria a explicação passo a passo gerada pela IA de verdade. '
            + 'Neste momento o app está com dados de demonstração — o motor de IA (Gemini) '
            + 'será conectado na fase de integração.',
        },
        {
          titulo: 'Exemplo prático',
          conteudo: 'Um exemplo resolvido apareceria aqui, com os cálculos ou argumentos '
            + 'organizados linha a linha para você acompanhar.',
        },
        {
          titulo: 'Resumo',
          conteudo: 'No final, a IA resume a ideia central em poucas frases para fixação.',
        },
      ],
    };

    return of(resposta).pipe(delay(ATRASO_IA));
  }

  /** Horário em que a cota reinicia (virada do dia). */
  horarioReinicio(): string {
    return '00:00';
  }
}
