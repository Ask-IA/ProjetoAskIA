// src/app/pages/quiz/quiz.ts
//
// Quiz por matéria com DADOS FALSOS.
// No produto final as questões serão geradas pela IA; aqui o fluxo completo
// já funciona: escolher matéria -> "gerando" -> responder -> nota final.

import { Component, OnInit, inject } from '@angular/core';
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

  materias: string[] = [];
  materiaEscolhida: string | null = null;

  questoes: QuestaoQuiz[] = [];
  indice = 0;
  respostaSelecionada: number | null = null;
  respondida = false;
  acertos = 0;

  gerando = false;
  terminou = false;

  ngOnInit(): void {
    this.revisao.materiasComQuiz().subscribe(m => (this.materias = m));
  }

  get atual(): QuestaoQuiz | null {
    return this.questoes[this.indice] ?? null;
  }

  gerar(): void {
    if (!this.materiaEscolhida) return;
    this.gerando = true;
    this.revisao.gerarQuiz(this.materiaEscolhida).subscribe(questoes => {
      this.questoes = questoes;
      this.gerando = false;
      this.indice = 0;
      this.acertos = 0;
      this.terminou = false;
      this.respondida = false;
      this.respostaSelecionada = null;
    });
  }

  confirmar(): void {
    if (this.respostaSelecionada === null || this.respondida) return;
    this.respondida = true;
    if (this.respostaSelecionada === this.atual?.correta) this.acertos++;
  }

  proxima(): void {
    if (this.indice + 1 >= this.questoes.length) {
      this.terminou = true;
      return;
    }
    this.indice++;
    this.respondida = false;
    this.respostaSelecionada = null;
  }

  refazer(): void {
    this.questoes = [];
    this.terminou = false;
    this.materiaEscolhida = null;
  }
}
