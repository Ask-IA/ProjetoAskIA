// src/app/services/ask-ia.service.ts
//
// Ask IA: estado das conversas + chamadas à IA (DADOS FALSOS por enquanto).
//
// 1) ESTADO DAS CONVERSAS
//    Fica aqui, e não no componente, para a conversa não sumir quando o aluno
//    vai ao Painel e volta. Antes, trocar de tela apagava tudo.
//
// 2) CONTRATO COM A IA (proposta para o João)
//    A resposta deixa de ser só uma lista de passos. Para a tela nova, o
//    prompt precisa devolver também:
//    - area: 'linguagens' | 'humanas' | 'natureza' | 'matematica' | null
//    - topico: nome curto do assunto (ex.: "Função afim")
//    - passos[].formula: opcional, a fórmula do passo em texto
//    - termos-chave entre ==sinais de igual== (viram marca-texto na tela)
//    - tenteVoce: { pergunta, resposta } — um exercício curto no fim
//    O modo (explicar, resolver, plano) vai junto com a pergunta.
//
// Para TESTAR na tela:
// - digite "erro"   → o mock devolve falha 500 (o texto continua no campo);
// - digite "demora" → a resposta leva 14 s (aparecem os avisos de espera e o Cancelar);
// - a cota começa com 3 perguntas usadas; na 11ª do dia vem o 429 (limite).
//
// TODO (integração): trocar perguntar() e cotaRestante() por HttpClient nos
// endpoints do João (ex.: POST {apiUrl}/api/ia/perguntar) e carregar as
// conversas de GET /api/ia/conversas (entidades Conversa e Mensagem do DER).
// TODO (integração): decidir com a equipe a biblioteca de Markdown + fórmulas
// (ex.: ngx-markdown + KaTeX). Quando entrar, cada fórmula vai num bloco com
// overflow-x: auto para não estourar a largura no celular.

import { Injectable, computed, signal } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay, mergeMap, tap } from 'rxjs/operators';
import { AreaEnem } from '../core/areas';

export type ModoAjuda = 'explicar' | 'resolver' | 'plano';

export const NOME_MODO: Record<ModoAjuda, string> = {
  explicar: 'Explicar',
  resolver: 'Resolver',
  plano: 'Plano',
};

export interface PassoResposta {
  titulo: string;
  conteudo: string;   // termos-chave entre ==...==
  formula?: string;
}

export interface TenteVoce {
  pergunta: string;
  resposta: string;
}

export interface RespostaIA {
  area: AreaEnem | null;
  topico: string | null;
  modo: ModoAjuda;
  passos: PassoResposta[];
  tenteVoce: TenteVoce | null;
  cotaRestante: number;
}

export interface MensagemAluno {
  autor: 'aluno';
  texto: string;
}

export interface MensagemIa {
  autor: 'ia';
  resposta: RespostaIA;
  /** No modo Resolver os passos aparecem um por vez. */
  passosVisiveis: number;
  tenteVoceAberto: boolean;
}

export type Mensagem = MensagemAluno | MensagemIa;

export interface Conversa {
  id: number;
  titulo: string;
  area: AreaEnem | null;
  atualizadaEm: Date;
  mensagens: Mensagem[];
}

export const COTA_DIARIA = 10;
const ATRASO_IA = 1400;      // ms — a IA "pensando", para a tela exibir o carregando
const ATRASO_LONGO = 14000;  // ms — para testar os avisos de espera

@Injectable({ providedIn: 'root' })
export class AskIaService {
  private usadasHoje = 3; // começa com 3 usadas para o contador já mostrar algo
  private proximoId = 100;

  // ================= 1) Estado das conversas =================

  readonly conversas = signal<Conversa[]>(conversasDeExemplo());
  readonly idAtual = signal<number | null>(null);

  /** Conversa que está esperando a IA (uma pergunta por vez). */
  readonly aguardando = signal<number | null>(null);

  readonly atual = computed(() => this.conversas().find(c => c.id === this.idAtual()) ?? null);

  readonly recentes = computed(() =>
    [...this.conversas()].sort((a, b) => b.atualizadaEm.getTime() - a.atualizadaEm.getTime())
  );

  abrir(id: number): void {
    if (this.conversas().some(c => c.id === id)) this.idAtual.set(id);
  }

  nova(): void {
    this.idAtual.set(null);
  }

  /**
   * Envia a pergunta e guarda pergunta e resposta na conversa certa.
   * A conversa é "capturada" no envio: se o aluno trocar de tela ou de
   * conversa enquanto a IA pensa, a resposta cai no lugar em que foi pedida.
   * Cancelar (unsubscribe) ou falhar tira a pergunta da conversa.
   */
  enviarPergunta(texto: string, modo: ModoAjuda): Observable<RespostaIA> {
    const conversaId = this.registrarPergunta(texto);
    this.aguardando.set(conversaId);

    return this.perguntar(texto, modo).pipe(
      tap({
        next: resposta => this.registrarResposta(conversaId, resposta),
        error: () => this.removerUltimaPergunta(conversaId),
        unsubscribe: () => this.removerUltimaPergunta(conversaId),
        finalize: () => this.aguardando.set(null),
      })
    );
  }

  revelarProximoPasso(indiceMensagem: number): void {
    this.alterarMensagemIa(indiceMensagem, m => ({
      ...m,
      passosVisiveis: Math.min(m.passosVisiveis + 1, m.resposta.passos.length),
    }));
  }

  abrirTenteVoce(indiceMensagem: number): void {
    this.alterarMensagemIa(indiceMensagem, m => ({ ...m, tenteVoceAberto: true }));
  }

  /** Põe a pergunta na conversa aberta (ou cria uma, se for a primeira). Devolve o id. */
  private registrarPergunta(texto: string): number {
    const mensagem: MensagemAluno = { autor: 'aluno', texto };
    const id = this.idAtual();

    if (id === null) {
      const nova: Conversa = {
        id: this.proximoId++,
        titulo: resumirTitulo(texto),
        area: null,
        atualizadaEm: new Date(),
        mensagens: [mensagem],
      };
      this.conversas.update(lista => [...lista, nova]);
      this.idAtual.set(nova.id);
      return nova.id;
    }

    this.alterar(id, conversa => ({
      ...conversa,
      atualizadaEm: new Date(),
      mensagens: [...conversa.mensagens, mensagem],
    }));
    return id;
  }

  private registrarResposta(conversaId: number, resposta: RespostaIA): void {
    const mensagem: MensagemIa = {
      autor: 'ia',
      resposta,
      // Resolver: um passo por vez, para o aluno tentar antes de ver o próximo
      passosVisiveis: resposta.modo === 'resolver' ? 1 : resposta.passos.length,
      tenteVoceAberto: false,
    };
    this.alterar(conversaId, conversa => ({
      ...conversa,
      area: conversa.area ?? resposta.area,
      atualizadaEm: new Date(),
      mensagens: [...conversa.mensagens, mensagem],
    }));
  }

  private removerUltimaPergunta(conversaId: number): void {
    const conversa = this.conversas().find(c => c.id === conversaId);
    if (!conversa) return;

    // era a primeira pergunta: a conversa inteira some
    if (conversa.mensagens.length <= 1) {
      this.conversas.update(lista => lista.filter(c => c.id !== conversaId));
      if (this.idAtual() === conversaId) this.idAtual.set(null);
      return;
    }
    this.alterar(conversaId, c => ({ ...c, mensagens: c.mensagens.slice(0, -1) }));
  }

  private alterar(conversaId: number | null, mudanca: (conversa: Conversa) => Conversa): void {
    this.conversas.update(lista => lista.map(c => (c.id === conversaId ? mudanca(c) : c)));
  }

  private alterarMensagemIa(indice: number, mudanca: (m: MensagemIa) => MensagemIa): void {
    this.alterar(this.idAtual(), conversa => ({
      ...conversa,
      mensagens: conversa.mensagens.map((m, i) => (i === indice && m.autor === 'ia' ? mudanca(m) : m)),
    }));
  }

  // ================= 2) Chamadas à IA (mock) =================

  cotaRestante(): Observable<number> {
    return of(COTA_DIARIA - this.usadasHoje).pipe(delay(200));
  }

  perguntar(pergunta: string, modo: ModoAjuda): Observable<RespostaIA> {
    const texto = normalizar(pergunta);

    // Simulação de erro do servidor, para testar o estado de erro da tela
    if (texto === 'erro') {
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
      ...montarResposta(pergunta, texto, modo),
      cotaRestante: COTA_DIARIA - this.usadasHoje,
    };
    return of(resposta).pipe(delay(texto === 'demora' ? ATRASO_LONGO : ATRASO_IA));
  }

  /** Horário em que a cota reinicia (virada do dia). */
  horarioReinicio(): string {
    return '00:00';
  }
}

// ================= Conteúdo de demonstração =================

interface Tema {
  gatilho: RegExp;
  area: AreaEnem;
  topico: string;
  passos: PassoResposta[];
  tenteVoce: TenteVoce;
}

const TEMAS: Tema[] = [
  {
    gatilho: /funcao afim|primeiro grau|1o grau/,
    area: 'matematica',
    topico: 'Função afim',
    passos: [
      {
        titulo: 'O que é',
        conteudo: 'Função afim é toda função da forma f(x) = ax + b, com a ≠ 0. O gráfico dela é sempre uma reta.',
        formula: 'f(x) = a·x + b',
      },
      {
        titulo: 'O papel de cada letra',
        conteudo: 'O a é a ==taxa de variação==: quanto f(x) muda quando x aumenta 1. O b é onde a reta ==corta o eixo y==, ou seja, f(0).',
      },
      {
        titulo: 'Exemplo',
        conteudo: 'Um táxi cobra R$ 5,00 fixos mais R$ 2,00 por km: f(x) = 2x + 5. Para 8 km, f(8) = 2·8 + 5 = 21, ou seja, R$ 21,00.',
      },
      {
        titulo: 'Resumo',
        conteudo: 'O a diz ==quanto cresce==; o b diz ==de onde parte==.',
      },
    ],
    tenteVoce: {
      pergunta: 'Com a mesma tarifa, quanto custa uma corrida de 12 km?',
      resposta: 'f(12) = 2·12 + 5 = 29, ou seja, R$ 29,00.',
    },
  },
  {
    gatilho: /crase/,
    area: 'linguagens',
    topico: 'Crase',
    passos: [
      {
        titulo: 'O que é',
        conteudo: 'Crase é a ==fusão da preposição a com o artigo a==. Ela aparece como acento grave: à.',
      },
      {
        titulo: 'Teste rápido',
        conteudo: 'Troque a palavra feminina por uma masculina. Se aparecer ==ao==, use crase: "Vou à escola" → "Vou ao colégio".',
      },
      {
        titulo: 'Quando não usar',
        conteudo: 'Antes de palavra masculina, de verbo e da maioria dos pronomes: "Vou a pé", "Começou a chover", "Refiro-me a ela".',
      },
      {
        titulo: 'Resumo',
        conteudo: 'Apareceu "ao" no masculino? Então ==no feminino é à==.',
      },
    ],
    tenteVoce: {
      pergunta: '"Entreguei o trabalho ___ professora." Vai crase?',
      resposta: 'Sim. No masculino seria "ao professor", então no feminino é "à professora".',
    },
  },
  {
    gatilho: /vargas|estado novo/,
    area: 'humanas',
    topico: 'Era Vargas',
    passos: [
      {
        titulo: 'O que foi',
        conteudo: 'Período de 1930 a 1945 em que Getúlio Vargas governou o Brasil. Começou com a ==Revolução de 1930==.',
      },
      {
        titulo: 'As três fases',
        conteudo: 'Governo Provisório (1930–1934), Governo Constitucional (1934–1937) e ==Estado Novo== (1937–1945), que foi uma ditadura.',
      },
      {
        titulo: 'O que marcou',
        conteudo: 'Centralização do poder, voto feminino (1932), a ==CLT== (1943) e investimento na indústria de base, como a Companhia Siderúrgica Nacional.',
      },
      {
        titulo: 'Resumo',
        conteudo: 'Modernização e direitos trabalhistas, mas ==com censura e repressão== no Estado Novo.',
      },
    ],
    tenteVoce: {
      pergunta: 'Em que ano começou o Estado Novo?',
      resposta: 'Em 1937, com o golpe que fechou o Congresso e impôs uma nova Constituição.',
    },
  },
  {
    gatilho: /newton|inercia/,
    area: 'natureza',
    topico: 'Primeira lei de Newton',
    passos: [
      {
        titulo: 'O que diz',
        conteudo: 'Todo corpo continua ==parado ou em movimento retilíneo uniforme== se a força resultante sobre ele for zero.',
      },
      {
        titulo: 'Inércia',
        conteudo: 'É a tendência de manter o estado de movimento. Quanto ==maior a massa, maior a inércia==.',
      },
      {
        titulo: 'Exemplo',
        conteudo: 'Quando o ônibus freia de repente, seu corpo continua indo para a frente. É por isso que existe o cinto de segurança.',
      },
      {
        titulo: 'Resumo',
        conteudo: 'Sem força resultante, ==nada muda no movimento==.',
      },
    ],
    tenteVoce: {
      pergunta: 'Por que dá para puxar a toalha rápido sem derrubar os pratos da mesa?',
      resposta: 'Por inércia: o puxão é rápido demais para mudar o movimento dos pratos, que tendem a continuar parados.',
    },
  },
];

function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/º/g, 'o').trim();
}

function resumirTitulo(pergunta: string): string {
  const limpo = pergunta.replace(/\s+/g, ' ').trim();
  return limpo.length > 42 ? limpo.slice(0, 40).trimEnd() + '…' : limpo;
}

function montarResposta(pergunta: string, texto: string, modo: ModoAjuda): Omit<RespostaIA, 'cotaRestante'> {
  const tema = TEMAS.find(t => t.gatilho.test(texto)) ?? null;

  if (modo === 'plano') {
    const assunto = tema ? tema.topico.toLowerCase() : 'esse assunto';
    return {
      area: tema?.area ?? null,
      topico: tema?.topico ?? null,
      modo,
      tenteVoce: null,
      passos: [
        {
          titulo: 'Dia 1 · Entender a base (30 min)',
          conteudo: `Peça ao Ask IA, no modo Explicar, a ideia central de ${assunto}. Anote ==com as suas palavras== o que entendeu.`,
        },
        {
          titulo: 'Dia 2 · Resolver junto (30 min)',
          conteudo: 'Resolva 3 exemplos no modo Resolver, tentando cada passo ==antes de ver o próximo==.',
        },
        {
          titulo: 'Dia 3 · Praticar sozinho (40 min)',
          conteudo: 'Faça um quiz da matéria e anote as questões que errou.',
        },
        {
          titulo: 'Dia 4 · Revisar o que errou (20 min)',
          conteudo: 'Revise nos flashcards só o que você errou. Se errar de novo, ==volte ao Dia 1== nesse ponto.',
        },
      ],
    };
  }

  if (tema) {
    return { area: tema.area, topico: tema.topico, modo, passos: tema.passos, tenteVoce: tema.tenteVoce };
  }

  return {
    area: null,
    topico: null,
    modo,
    tenteVoce: null,
    passos: [
      {
        titulo: 'Entendendo a pergunta',
        conteudo: `Você perguntou: "${pergunta}". Vamos por partes, começando pelo ==conceito principal== envolvido.`,
      },
      {
        titulo: 'Explicação do conceito',
        conteudo: 'Aqui entraria a explicação passo a passo gerada pela IA de verdade. Neste momento o app está com dados '
          + 'de demonstração: o motor de IA (Gemini) será conectado na fase de integração.',
      },
      {
        titulo: 'Exemplo prático',
        conteudo: 'Um exemplo resolvido apareceria aqui, com os cálculos ou argumentos organizados linha a linha para você acompanhar.',
      },
      {
        titulo: 'Resumo',
        conteudo: 'No final, a IA resume a ideia central em poucas frases para ==fixar==.',
      },
    ],
  };
}

/** Três conversas antigas, para a lista "Conversas recentes" não nascer vazia. */
function conversasDeExemplo(): Conversa[] {
  const diasAtras = (dias: number, hora: number) => {
    const data = new Date();
    data.setDate(data.getDate() - dias);
    data.setHours(hora, 10, 0, 0);
    return data;
  };

  const exemplo = (id: number, pergunta: string, indiceTema: number, quando: Date): Conversa => {
    const tema = TEMAS[indiceTema];
    return {
      id,
      titulo: resumirTitulo(pergunta),
      area: tema.area,
      atualizadaEm: quando,
      mensagens: [
        { autor: 'aluno', texto: pergunta },
        {
          autor: 'ia',
          passosVisiveis: tema.passos.length,
          tenteVoceAberto: false,
          resposta: {
            area: tema.area,
            topico: tema.topico,
            modo: 'explicar',
            passos: tema.passos,
            tenteVoce: tema.tenteVoce,
            cotaRestante: COTA_DIARIA,
          },
        },
      ],
    };
  };

  return [
    exemplo(1, 'Quando usar crase?', 1, diasAtras(1, 20)),
    exemplo(2, 'O que foi a Era Vargas?', 2, diasAtras(1, 18)),
    exemplo(3, 'Me explique a primeira lei de Newton', 3, diasAtras(3, 19)),
  ];
}
