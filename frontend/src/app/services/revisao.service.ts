// src/app/services/revisao.service.ts
//
// DADOS FALSOS (mock) de Flashcards e Quiz.
// No produto final, os dois serão GERADOS PELA IA (parte do João);
// aqui existem cartões e perguntas fixos só para a tela funcionar.
//
// TODO (integração): trocar por chamadas ao backend de IA quando existir.

import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

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
}

@Injectable({ providedIn: 'root' })
export class RevisaoService {
  private flashcards: Flashcard[] = [
    { id: 1, materia: 'Matemática', frente: 'O que caracteriza uma função afim?', verso: 'Uma função do tipo f(x) = ax + b, com a ≠ 0. Seu gráfico é uma reta.' },
    { id: 2, materia: 'Matemática', frente: 'O que o coeficiente "a" representa na função afim?', verso: 'A inclinação da reta: a > 0 é crescente, a < 0 é decrescente.' },
    { id: 3, materia: 'Português', frente: 'Quando se usa crase?', verso: 'Na fusão da preposição "a" com o artigo "a": antes de palavras femininas que aceitam artigo.' },
    { id: 4, materia: 'História', frente: 'O que foi a Era Vargas?', verso: 'Período (1930–1945) em que Getúlio Vargas governou o Brasil, marcado por centralização política e leis trabalhistas.' },
    { id: 5, materia: 'Geografia', frente: 'O que é urbanização?', verso: 'O crescimento das cidades em relação ao campo, com concentração populacional em áreas urbanas.' },
    { id: 6, materia: 'Matemática', frente: 'Como calcular 15% de um valor?', verso: 'Multiplique o valor por 0,15 (ou por 15 e divida por 100).' },
  ];

  private questoesPorMateria: Record<string, QuestaoQuiz[]> = {
    'Matemática': [
      { enunciado: 'Qual é o valor de f(2) para f(x) = 3x + 1?', alternativas: ['5', '6', '7', '8'], correta: 2 },
      { enunciado: 'O gráfico de uma função afim é sempre:', alternativas: ['Uma parábola', 'Uma reta', 'Uma curva', 'Um círculo'], correta: 1 },
      { enunciado: '25% de 200 é:', alternativas: ['25', '50', '75', '100'], correta: 1 },
      { enunciado: 'Se a < 0 em f(x) = ax + b, a função é:', alternativas: ['Crescente', 'Constante', 'Decrescente', 'Nula'], correta: 2 },
      { enunciado: 'A raiz de f(x) = 2x - 8 é:', alternativas: ['2', '4', '6', '8'], correta: 1 },
    ],
    'Português': [
      { enunciado: 'Em qual frase a crase está correta?', alternativas: ['Vou à escola.', 'Vou à passear.', 'Refiro-me à ele.', 'Cheguei à casa cedo (minha casa).'], correta: 0 },
      { enunciado: '"Interpretação de texto" avalia principalmente:', alternativas: ['Memorização', 'Compreensão', 'Caligrafia', 'Velocidade'], correta: 1 },
      { enunciado: 'Sinônimo de "conciso":', alternativas: ['Longo', 'Confuso', 'Breve', 'Repetitivo'], correta: 2 },
      { enunciado: 'A norma culta exige concordância entre:', alternativas: ['Sujeito e verbo', 'Verbo e vírgula', 'Artigo e ponto', 'Sujeito e parágrafo'], correta: 0 },
      { enunciado: 'Qual é figura de linguagem em "chorou rios de lágrimas"?', alternativas: ['Metonímia', 'Hipérbole', 'Eufemismo', 'Ironia'], correta: 1 },
    ],
  };

  listarFlashcards(): Observable<Flashcard[]> {
    return of([...this.flashcards]).pipe(delay(250));
  }

  materiasComQuiz(): Observable<string[]> {
    return of(Object.keys(this.questoesPorMateria)).pipe(delay(200));
  }

  gerarQuiz(materia: string): Observable<QuestaoQuiz[]> {
    const questoes = this.questoesPorMateria[materia] ?? [];
    // delay maior de propósito: simula a IA gerando o quiz
    return of([...questoes]).pipe(delay(1200));
  }
}
