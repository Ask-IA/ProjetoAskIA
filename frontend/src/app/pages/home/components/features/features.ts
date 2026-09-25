import { Component, ElementRef, signal, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icone, NomeIcone } from '../../../../shared/icone';

interface Recurso {
  icone: NomeIcone; // o mesmo ícone do menu do app: quem vê aqui reconhece lá dentro
  titulo: string;
  descricao: string;
  exemplo: string;  // exemplo concreto do que o aluno faz nessa seção
}

@Component({
  selector: 'app-features',
  imports: [RouterLink, Icone],
  templateUrl: './features.html',
  styleUrl: './features.css',
})
export class Features {
  private trilho = viewChild<ElementRef<HTMLElement>>('trilho');

  /**
   * As seções REAIS do produto — as mesmas do menu do app. O Ask IA tem um
   * cartão próprio, maior, porque é o produto; as outras seis vêm aqui.
   *
   * Antes esta seção prometia "Trilhas Personalizadas", "Tutor Virtual 24/7" e
   * "Simulados Adaptativos", que não existem como funcionalidade. Prometer o que
   * o app não faz é o tipo de coisa que alguém cobra numa demonstração.
   */
  readonly recursos: Recurso[] = [
    {
      icone: 'painel',
      titulo: 'Painel',
      descricao: 'Seu resumo do dia: ofensiva, cartões para revisar, tempo da semana e onde focar agora.',
      exemplo: 'Ex.: 5 dias seguidos · 3 h 20 na semana',
    },
    {
      icone: 'materias',
      titulo: 'Matérias',
      descricao: 'Cadastre suas matérias, quebre cada uma em tópicos e vá marcando o que já domina.',
      exemplo: 'Ex.: Matemática › Função afim, concluído',
    },
    {
      icone: 'cronograma',
      titulo: 'Cronograma',
      descricao: 'Monte metas por dia da semana e registre quanto tempo estudou em cada sessão.',
      exemplo: 'Ex.: Segunda, 19:00 · revisar crase',
    },
    {
      icone: 'flashcards',
      titulo: 'Flashcards',
      descricao: 'Revise em cartões de pergunta e resposta e acompanhe seus acertos ao final da rodada.',
      exemplo: 'Ex.: “Quando se usa crase?” · vire o cartão',
    },
    {
      icone: 'quiz',
      titulo: 'Quiz IA',
      descricao: 'Escolha a matéria e responda questões, com a correção e o porquê de cada resposta na hora.',
      exemplo: 'Ex.: 5 questões de Matemática · 4 de 5',
    },
    {
      icone: 'progresso',
      titulo: 'Progresso',
      descricao: 'Veja sua sequência de dias estudando e quanto já concluiu de cada matéria.',
      exemplo: 'Ex.: Matemática · 3 de 5 tópicos',
    },
  ];

  // signal: o app é zoneless
  readonly indiceAtivo = signal(0);

  /** No celular os seis cartões viram carrossel: a bolinha leva até o cartão. */
  irPara(indice: number): void {
    const trilho = this.trilho()?.nativeElement;
    const cartao = trilho?.children[indice] as HTMLElement | undefined;
    if (!trilho || !cartao) return;
    this.indiceAtivo.set(indice);
    trilho.scrollTo({ left: cartao.offsetLeft - trilho.offsetLeft, behavior: 'smooth' });
  }

  /** Mantém as bolinhas em sincronia quando a pessoa arrasta com o dedo. */
  aoRolar(): void {
    const trilho = this.trilho()?.nativeElement;
    if (!trilho) return;

    const posicao = trilho.scrollLeft + trilho.offsetLeft;
    let maisProximo = 0;
    let menorDistancia = Number.POSITIVE_INFINITY;
    Array.from(trilho.children).forEach((filho, i) => {
      const distancia = Math.abs((filho as HTMLElement).offsetLeft - posicao);
      if (distancia < menorDistancia) {
        menorDistancia = distancia;
        maisProximo = i;
      }
    });
    this.indiceAtivo.set(maisProximo);
  }
}
