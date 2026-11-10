// src/app/pages/redacao/redacao.ts
//
// Corretor de redação no modelo do ENEM: o aluno informa o tema e o texto, a IA corrige nas
// 5 competências e a tela mostra a nota estimada (0 a 1000), o motivo de cada nota e o que
// fazer para subir.
//
// Três estados: escrevendo → corrigindo → resultado. Voltar do resultado para "escrevendo"
// mantém o texto, para o aluno ajustar e corrigir de novo.
//
// O texto também fica salvo como RASCUNHO neste navegador (localStorage): uma redação tem
// 30 linhas, perder isso por trocar de aba ou por erro de rede é o pior cenário da tela.
// Todo acesso ao localStorage é protegido por try/catch (aba anônima, armazenamento bloqueado).

import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CorrecaoRedacao, RedacaoService } from '../../services/redacao.service';
import { Icone } from '../../shared/icone';

type Estado = 'escrevendo' | 'corrigindo' | 'resultado';

const CHAVE_RASCUNHO = 'askia.redacao.rascunho';
/** Mesmas regras do backend (RedacaoService): validar aqui só evita ida e volta à toa. */
const MINIMO_DE_PALAVRAS = 80;
const MAXIMO_DE_CARACTERES = 5000;
const MINIMO_TEMA = 5;

@Component({
  selector: 'app-redacao',
  standalone: true,
  imports: [FormsModule, Icone],
  templateUrl: './redacao.html',
  styleUrl: './redacao.css',
  host: { class: 'pagina' },
})
export class Redacao implements OnInit {
  private redacao = inject(RedacaoService);

  readonly minimoDePalavras = MINIMO_DE_PALAVRAS;
  readonly maximoDeCaracteres = MAXIMO_DE_CARACTERES;

  estado = signal<Estado>('escrevendo');
  tema = signal('');
  texto = signal('');
  erro = signal('');
  correcao = signal<CorrecaoRedacao | null>(null);
  /** null = ainda não sabemos (cota não carregou); a tela não bloqueia por isso. */
  restantes = signal<number | null>(null);

  palavras = computed(() => {
    const limpo = this.texto().trim();
    return limpo ? limpo.split(/\s+/).length : 0;
  });

  caracteres = computed(() => this.texto().trim().length);

  podeCorrigir = computed(() =>
    this.tema().trim().length >= MINIMO_TEMA
    && this.palavras() >= MINIMO_DE_PALAVRAS
    && this.caracteres() <= MAXIMO_DE_CARACTERES
    && this.restantes() !== 0
  );

  /** Explica, em uma linha, por que o botão está desligado (em vez de só deixá-lo cinza). */
  motivoBloqueio = computed(() => {
    if (this.restantes() === 0) return 'Você já usou as correções de hoje. Elas voltam à meia-noite.';
    if (this.tema().trim().length < MINIMO_TEMA) return 'Informe o tema da proposta.';
    if (this.palavras() < MINIMO_DE_PALAVRAS) {
      return `Faltam ${MINIMO_DE_PALAVRAS - this.palavras()} palavras para o mínimo (no ENEM, até 7 linhas vale zero).`;
    }
    if (this.caracteres() > MAXIMO_DE_CARACTERES) return 'O texto passou do tamanho máximo.';
    return '';
  });

  ngOnInit(): void {
    this.carregarRascunho();
    this.redacao.cota().subscribe({
      next: cota => this.restantes.set(cota.restantes),
      error: () => this.restantes.set(null),
    });
  }

  mudarTema(valor: string): void {
    this.tema.set(valor);
    this.salvarRascunho();
  }

  mudarTexto(valor: string): void {
    this.texto.set(valor);
    this.salvarRascunho();
  }

  corrigir(): void {
    if (!this.podeCorrigir() || this.estado() === 'corrigindo') return;
    this.erro.set('');
    this.estado.set('corrigindo');

    this.redacao.corrigir(this.tema().trim(), this.texto().trim()).subscribe({
      next: resultado => {
        this.correcao.set(resultado);
        this.restantes.set(resultado.correcoesRestantes);
        this.estado.set('resultado');
      },
      error: (falha: HttpErrorResponse) => {
        // O texto NUNCA é apagado em caso de erro: volta para a edição com tudo no lugar.
        this.estado.set('escrevendo');
        this.erro.set(this.mensagemDeErro(falha));
        if (falha.status === 429) this.restantes.set(0);
      },
    });
  }

  /** Volta para o texto, como estava, para ajustar e corrigir de novo. */
  editar(): void {
    this.estado.set('escrevendo');
  }

  /** Começa do zero: limpa tema, texto, correção e o rascunho salvo. */
  novaRedacao(): void {
    this.tema.set('');
    this.texto.set('');
    this.correcao.set(null);
    this.erro.set('');
    this.estado.set('escrevendo');
    this.salvarRascunho();
  }

  porcentagem(nota: number): number {
    return Math.round((nota / 200) * 100);
  }

  private mensagemDeErro(falha: HttpErrorResponse): string {
    if (falha.status === 0) return 'Sem conexão com o servidor. Seu texto continua aqui.';
    if (falha.status === 503) {
      return 'A IA não respondeu agora. Seu texto continua aqui: tente de novo em alguns instantes (essa tentativa não contou).';
    }
    const doServidor = falha.error?.message;
    return typeof doServidor === 'string' && doServidor
      ? doServidor
      : 'Não foi possível corrigir agora. Seu texto continua aqui.';
  }

  private carregarRascunho(): void {
    try {
      const salvo = localStorage.getItem(CHAVE_RASCUNHO);
      if (!salvo) return;
      const { tema, texto } = JSON.parse(salvo) as { tema?: string; texto?: string };
      this.tema.set(typeof tema === 'string' ? tema : '');
      this.texto.set(typeof texto === 'string' ? texto : '');
    } catch {
      // Sem armazenamento disponível: a tela funciona igual, só não guarda o rascunho.
    }
  }

  private salvarRascunho(): void {
    try {
      if (!this.tema() && !this.texto()) {
        localStorage.removeItem(CHAVE_RASCUNHO);
      } else {
        localStorage.setItem(CHAVE_RASCUNHO, JSON.stringify({ tema: this.tema(), texto: this.texto() }));
      }
    } catch {
      // idem
    }
  }
}
