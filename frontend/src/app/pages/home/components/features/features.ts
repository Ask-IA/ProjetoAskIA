import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';

declare const lucide: any;

interface Recurso {
  icone: string;   // nome do ícone no lucide
  titulo: string;
  descricao: string;
  exemplo: string; // exemplo concreto do que o aluno faz nessa seção
}

@Component({
  selector: 'app-features',
  imports: [],
  templateUrl: './features.html',
  styleUrl: './features.css',
})
export class Features implements AfterViewInit {

  @ViewChild('trilho') trilho?: ElementRef<HTMLDivElement>;

  /**
   * As sete seções REAIS do produto — as mesmas do menu do app.
   *
   * Antes esta seção prometia "Trilhas Personalizadas", "Tutor Virtual 24/7" e
   * "Simulados Adaptativos", que não existem como funcionalidade. Prometer o que
   * o app não faz é o tipo de coisa que alguém cobra numa demonstração.
   */
  recursos: Recurso[] = [
    {
      icone: 'sparkles',
      titulo: 'Ask IA',
      descricao: 'Tire dúvidas de qualquer matéria e receba a explicação dividida em passos, não só a resposta pronta.',
      exemplo: 'Ex.: "Me explique função afim com um exemplo"',
    },
    {
      icone: 'layout-dashboard',
      titulo: 'Painel',
      descricao: 'Seu resumo do dia: tempo estudado, tópicos concluídos e em quais matérias você vai melhor ou pior.',
      exemplo: 'Ex.: 40 min hoje · 3 tópicos concluídos',
    },
    {
      icone: 'book-open',
      titulo: 'Matérias',
      descricao: 'Cadastre suas matérias, quebre cada uma em tópicos e vá marcando o que já domina.',
      exemplo: 'Ex.: Matemática › Função Afim ✓',
    },
    {
      icone: 'calendar-days',
      titulo: 'Cronograma',
      descricao: 'Monte metas por dia da semana e registre quanto tempo estudou em cada sessão.',
      exemplo: 'Ex.: Segunda, 19:00 — revisar Crase',
    },
    {
      icone: 'layers',
      titulo: 'Flashcards',
      descricao: 'Revise em cartões de pergunta e resposta e acompanhe seus acertos ao final da rodada.',
      exemplo: 'Ex.: "Quando se usa crase?" → vire o cartão',
    },
    {
      icone: 'target',
      titulo: 'Quiz IA',
      descricao: 'Escolha a matéria e responda questões para testar o que aprendeu, com correção na hora.',
      exemplo: 'Ex.: 5 questões de Matemática · nota 4/5',
    },
    {
      icone: 'trending-up',
      titulo: 'Progresso',
      descricao: 'Veja sua sequência de dias estudando e o quanto já dominou de cada matéria.',
      exemplo: 'Ex.: 5 dias seguidos · Matemática 67%',
    },
  ];

  indiceAtivo = 0;

  ngAfterViewInit(): void {
    // Os ícones do lucide são desenhados a partir dos <i data-lucide="...">.
    // Como todos os cartões já existem no HTML (o carrossel só rola na
    // horizontal), uma chamada só aqui basta.
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }

  anterior(): void {
    this.irPara(this.indiceAtivo - 1);
  }

  proximo(): void {
    this.irPara(this.indiceAtivo + 1);
  }

  /** Move o carrossel até o cartão pedido (sem passar dos limites). */
  irPara(indice: number): void {
    const trilho = this.trilho?.nativeElement;
    if (!trilho) return;

    const limite = this.recursos.length - 1;
    this.indiceAtivo = Math.min(Math.max(indice, 0), limite);

    const cartao = trilho.children[this.indiceAtivo] as HTMLElement | undefined;
    if (cartao) {
      trilho.scrollTo({ left: cartao.offsetLeft - trilho.offsetLeft, behavior: 'smooth' });
    }
  }

  /**
   * Mantém as bolinhas em sincronia quando a pessoa arrasta o carrossel
   * com o dedo ou com a barra de rolagem, em vez de usar as setas.
   */
  aoRolar(): void {
    const trilho = this.trilho?.nativeElement;
    if (!trilho) return;

    const cartoes = Array.from(trilho.children) as HTMLElement[];
    const posicao = trilho.scrollLeft + trilho.offsetLeft;

    let maisProximo = 0;
    let menorDistancia = Number.POSITIVE_INFINITY;
    cartoes.forEach((cartao, i) => {
      const distancia = Math.abs(cartao.offsetLeft - posicao);
      if (distancia < menorDistancia) {
        menorDistancia = distancia;
        maisProximo = i;
      }
    });
    this.indiceAtivo = maisProximo;
  }
}
