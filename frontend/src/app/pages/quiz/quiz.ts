// src/app/pages/quiz/quiz.ts
//
// Quiz por matéria (ainda com DADOS FALSOS).
// O que chega de forma assíncrona (lista de matérias, questões "geradas"
// pela IA) fica em signals — no modo zoneless é o que faz a tela redesenhar.

import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { QuestaoQuiz, RevisaoService } from '../../services/revisao.service';

@Component({
  selector: 'app-quiz',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './quiz.html',
  styleUrl: './quiz.css',
})
export class Quiz implements OnInit {
  private revisao = inject(RevisaoService);

  materias = signal<string[]>([]);
  questoes = signal<QuestaoQuiz[]>([]);
  gerando = signal(false);
  terminou = signal(false);
  erro = signal('');

  indice = signal(0);
  respostaSelecionada = signal<number | null>(null);
  respondida = signal(false);
  acertos = signal(0);

  // ligado ao [(ngModel)] do <select>
  materiaEscolhida: string | null = null;

  atual = computed<QuestaoQuiz | null>(() => this.questoes()[this.indice()] ?? null);

  ngOnInit(): void {
    this.revisao.materiasComQuiz().subscribe({
      next: m => this.materias.set(m),
      error: () => this.erro.set('Não foi possível carregar as matérias.'),
    });
  }

  gerar(): void {
    if (!this.materiaEscolhida) return;
    this.gerando.set(true);
    this.erro.set('');

    this.revisao.gerarQuiz(this.materiaEscolhida).subscribe({
      next: questoes => {
        this.questoes.set(questoes);
        this.gerando.set(false);
        this.indice.set(0);
        this.acertos.set(0);
        this.terminou.set(false);
        this.respondida.set(false);
        this.respostaSelecionada.set(null);
      },
      error: () => {
        this.gerando.set(false);
        this.erro.set('Não foi possível gerar o quiz agora.');
      },
    });
  }

  confirmar(): void {
    if (this.respostaSelecionada() === null || this.respondida()) return;
    this.respondida.set(true);
    if (this.respostaSelecionada() === this.atual()?.correta) {
      this.acertos.update(n => n + 1);
    }
  }

  proxima(): void {
    if (this.indice() + 1 >= this.questoes().length) {
      this.terminou.set(true);
      return;
    }
    this.indice.update(i => i + 1);
    this.respondida.set(false);
    this.respostaSelecionada.set(null);
  }

  refazer(): void {
    this.questoes.set([]);
    this.terminou.set(false);
    this.materiaEscolhida = null;
  }
}
