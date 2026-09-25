import { Component } from '@angular/core';

@Component({
  selector: 'app-info',
  imports: [],
  templateUrl: './info.html',
  styleUrl: './info.css',
})
export class Info {
  // Os quatro passos do ciclo de estudo
  readonly passos = [
    {
      titulo: 'Pergunte',
      texto: 'Digite a dúvida do jeito que ela apareceu na sua cabeça. A IA responde em passos numerados, '
        + 'para você acompanhar o raciocínio e não só copiar.',
    },
    {
      titulo: 'Organize',
      texto: 'Cadastre suas matérias e quebre cada uma em tópicos. Monte metas por dia da semana e registre '
        + 'o tempo de cada sessão de estudo.',
    },
    {
      titulo: 'Pratique',
      texto: 'Responda quizzes da matéria que escolher e revise em flashcards. A correção vem na hora, '
        + 'com o porquê de cada resposta.',
    },
    {
      titulo: 'Acompanhe',
      texto: 'Veja quanto tempo estudou, quantos tópicos concluiu e em quais áreas está mais forte ou mais '
        + 'fraco, para saber onde investir a próxima hora.',
    },
  ];
}
