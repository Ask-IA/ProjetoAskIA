// src/app/services/ask-ia.service.ts
//
// Ask IA: estado das conversas + chamadas à IA.
//
// 1) HISTÓRICO (REAL, vem do backend)
//    As conversas são carregadas de GET /api/conversas e cada pergunta com a
//    resposta é gravada em POST /api/conversas/interacoes. Assim o histórico
//    sobrevive ao F5 e é sempre o do usuário logado (o backend filtra pela sessão).
//    O estado vive aqui, e não no componente, para a conversa não sumir quando o
//    aluno vai ao Painel e volta. Ele é ZERADO ao sair/trocar de conta (limpar()).
//
// 2) IA (AINDA DADOS FALSOS)
//    perguntar() e cotaRestante() continuam mock até o motor de IA ser conectado.
//    Contrato proposto para a IA (proposta para o João):
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
// TODO (integração): trocar perguntar() e cotaRestante() pelos endpoints do João
// (ex.: POST {apiUrl}/api/ia/perguntar). Quando o backend chamar a IA e gravar o
// histórico sozinho, apague salvar() e o POST /api/conversas/interacoes.
// TODO (integração): decidir com a equipe a biblioteca de Markdown + fórmulas
// (ex.: ngx-markdown + KaTeX). Quando entrar, cada fórmula vai num bloco com
// overflow-x: auto para não estourar a largura no celular.

import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay, map, mergeMap, switchMap, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { AreaEnem, AREAS } from '../core/areas';

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
  /**
   * false = veio só na lista (sem mensagens); o conteúdo é buscado ao abrir.
   * Conversas criadas nesta sessão já nascem com as mensagens em mãos.
   */
  carregada: boolean;
}

// ---- Formatos que o backend devolve (ConversaController) ----

interface ConversaResumoApi {
  id: number;
  titulo: string;
  area: string | null;
  criadaEm: string;
  atualizadaEm: string;
}

interface PaginaApi<T> {
  conteudo: T[];
  pagina: number;
  tamanho: number;
  totalElementos: number;
  totalPaginas: number;
  ultima: boolean;
}

interface MensagemApi {
  id: number;
  autor: 'aluno' | 'ia';
  modo: string | null;
  texto: string | null;
  topico: string | null;
  passos: { titulo: string; conteudo: string; formula: string | null }[];
  tenteVoce: { pergunta: string | null; resposta: string | null } | null;
  criadaEm: string;
}

interface ConversaDetalheApi extends ConversaResumoApi {
  mensagens: MensagemApi[];
}

export const COTA_DIARIA = 10;
const ATRASO_IA = 1400;      // ms — a IA "pensando", para a tela exibir o carregando
const ATRASO_LONGO = 14000;  // ms — para testar os avisos de espera

/** Quantas conversas a lista traz de uma vez (o backend aceita até 50). */
const TAMANHO_DA_LISTA = 50;

@Injectable({ providedIn: 'root' })
export class AskIaService {
  private http = inject(HttpClient);
  private readonly api = `${environment.apiUrl}/api/conversas`;

  private usadasHoje = 3; // começa com 3 usadas para o contador já mostrar algo (mock)

  /** Conversas ainda não salvas recebem id negativo; o backend dá o id verdadeiro. */
  private proximoIdLocal = -1;

  /**
   * Sobe a cada limpar(). Resposta do servidor que chega depois de um logout
   * (geração antiga) é descartada, para não misturar contas.
   */
  private geracao = 0;

  // ================= 1) Estado das conversas =================

  readonly conversas = signal<Conversa[]>([]);
  readonly idAtual = signal<number | null>(null);

  /** Conversa que está esperando a IA (uma pergunta por vez). */
  readonly aguardando = signal<number | null>(null);

  readonly carregandoLista = signal(false);
  readonly erroLista = signal(false);
  /** Buscando as mensagens de uma conversa que veio só na lista. */
  readonly carregandoConversa = signal(false);
  readonly erroConversa = signal('');

  readonly atual = computed(() => this.conversas().find(c => c.id === this.idAtual()) ?? null);

  readonly recentes = computed(() =>
    [...this.conversas()].sort((a, b) => b.atualizadaEm.getTime() - a.atualizadaEm.getTime())
  );

  /**
   * Esquece TUDO que está em memória. Chamado ao sair da conta ou ao entrar
   * com outra. Sem isso, este serviço (que vive enquanto a aba está aberta)
   * mostraria as conversas do usuário anterior.
   */
  limpar(): void {
    this.geracao++;
    this.conversas.set([]);
    this.idAtual.set(null);
    this.aguardando.set(null);
    this.carregandoLista.set(false);
    this.erroLista.set(false);
    this.carregandoConversa.set(false);
    this.erroConversa.set('');
  }

  /** Busca a lista de conversas do usuário logado (mais recentes primeiro). */
  carregarConversas(): void {
    const geracao = this.geracao;
    this.carregandoLista.set(true);
    this.erroLista.set(false);

    this.http
      .get<PaginaApi<ConversaResumoApi>>(this.api, { params: { page: 0, size: TAMANHO_DA_LISTA } })
      .subscribe({
        next: pagina => {
          if (geracao !== this.geracao) return;
          this.mesclarLista(pagina.conteudo);
          this.carregandoLista.set(false);
        },
        error: () => {
          if (geracao !== this.geracao) return;
          this.erroLista.set(true);
          this.carregandoLista.set(false);
        },
      });
  }

  /**
   * Abre a conversa. Se as mensagens ainda não foram buscadas, busca no backend.
   * `aoCarregar` roda quando o conteúdo já está na tela (a tela usa para rolar até o fim).
   */
  abrir(id: number, aoCarregar?: () => void): void {
    this.idAtual.set(id);
    this.erroConversa.set('');

    const existente = this.conversas().find(c => c.id === id);
    if (id < 0 || existente?.carregada) {
      aoCarregar?.();
      return;
    }

    const geracao = this.geracao;
    this.carregandoConversa.set(true);
    this.http.get<ConversaDetalheApi>(`${this.api}/${id}`).subscribe({
      next: detalhe => {
        if (geracao !== this.geracao) return;
        this.guardarDetalhe(detalhe);
        if (this.idAtual() === id) this.carregandoConversa.set(false);
        aoCarregar?.();
      },
      error: (erro: { status?: number }) => {
        if (geracao !== this.geracao) return;
        if (this.idAtual() !== id) return; // o aluno já foi para outra conversa
        this.carregandoConversa.set(false);
        if (erro?.status === 404) {
          this.idAtual.set(null); // não existe (ou é de outro usuário)
        } else {
          this.erroConversa.set('Não foi possível abrir essa conversa agora.');
        }
      },
    });
  }

  nova(): void {
    this.idAtual.set(null);
    this.erroConversa.set('');
  }

  /**
   * Envia a pergunta, pede a resposta à IA e SALVA os dois no backend.
   * A conversa é "capturada" no envio: se o aluno trocar de tela ou de
   * conversa enquanto a IA pensa, a resposta cai no lugar em que foi pedida.
   * Cancelar (unsubscribe) ou falhar (na IA ou ao salvar) tira a pergunta da conversa.
   * A resposta só aparece na tela depois de salva: o que se vê é o que está no histórico.
   */
  enviarPergunta(texto: string, modo: ModoAjuda): Observable<RespostaIA> {
    const conversaId = this.registrarPergunta(texto);
    this.aguardando.set(conversaId);

    return this.perguntar(texto, modo).pipe(
      switchMap(resposta =>
        this.salvar(conversaId, texto, modo, resposta).pipe(map(resumo => ({ resposta, resumo })))
      ),
      tap({
        next: ({ resposta, resumo }) => {
          const idReal = this.confirmarConversa(conversaId, resumo);
          this.registrarResposta(idReal, resposta);
        },
        error: () => this.removerUltimaPergunta(conversaId),
        unsubscribe: () => this.removerUltimaPergunta(conversaId),
        finalize: () => this.aguardando.set(null),
      }),
      map(({ resposta }) => resposta)
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

  /** POST /api/conversas/interacoes: grava pergunta + resposta e devolve a conversa atualizada. */
  private salvar(conversaId: number, pergunta: string, modo: ModoAjuda, resposta: RespostaIA): Observable<ConversaResumoApi> {
    const corpo = {
      conversaId: conversaId > 0 ? conversaId : null, // id negativo = conversa nova
      modo,
      pergunta,
      resposta: {
        area: resposta.area,
        topico: resposta.topico,
        passos: resposta.passos.map(p => ({ titulo: p.titulo, conteudo: p.conteudo, formula: p.formula ?? null })),
        tenteVoce: resposta.tenteVoce,
      },
    };
    return this.http.post<ConversaResumoApi>(`${this.api}/interacoes`, corpo);
  }

  /** Troca o id provisório pelo id real e copia título, área e data que o servidor definiu. */
  private confirmarConversa(idLocal: number, resumo: ConversaResumoApi): number {
    const idReal = resumo.id;
    this.conversas.update(lista =>
      lista.map(c =>
        c.id === idLocal
          ? { ...c, id: idReal, titulo: resumo.titulo, area: paraArea(resumo.area) ?? c.area, atualizadaEm: paraData(resumo.atualizadaEm) }
          : c
      )
    );
    if (this.idAtual() === idLocal) this.idAtual.set(idReal);
    if (this.aguardando() === idLocal) this.aguardando.set(idReal);
    return idReal;
  }

  /** Junta a lista do servidor com o que já está na tela (não perde mensagens já abertas). */
  private mesclarLista(itens: ConversaResumoApi[]): void {
    this.conversas.update(atuais => {
      const porId = new Map(atuais.map(c => [c.id, c]));
      const doServidor = itens.map(item => {
        const local = porId.get(item.id);
        return {
          ...paraConversa(item),
          mensagens: local?.mensagens ?? [],
          carregada: local?.carregada ?? false,
        };
      });
      const emEnvio = atuais.filter(c => c.id < 0); // conversa nova esperando ser salva
      return [...doServidor, ...emEnvio];
    });
  }

  private guardarDetalhe(detalhe: ConversaDetalheApi): void {
    const base = paraConversa(detalhe);
    const conversa: Conversa = {
      ...base,
      mensagens: detalhe.mensagens.map(m => paraMensagem(m, base.area)),
      carregada: true,
    };
    this.conversas.update(lista =>
      lista.some(c => c.id === conversa.id)
        ? lista.map(c => (c.id === conversa.id ? conversa : c))
        : [...lista, conversa]
    );
  }

  /** Põe a pergunta na conversa aberta (ou cria uma, se for a primeira). Devolve o id. */
  private registrarPergunta(texto: string): number {
    const mensagem: MensagemAluno = { autor: 'aluno', texto };
    const id = this.idAtual();

    if (id === null) {
      const nova: Conversa = {
        id: this.proximoIdLocal--,
        titulo: resumirTitulo(texto),
        area: null,
        atualizadaEm: new Date(),
        mensagens: [mensagem],
        carregada: true,
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

// ================= Conversão backend → tela =================

function paraArea(area: string | null): AreaEnem | null {
  return AREAS.includes(area as AreaEnem) ? (area as AreaEnem) : null;
}

/** Lê a data ISO do backend (com fuso). Corta a fração a milissegundos: o Safari não aceita mais que isso. */
function paraData(iso: string): Date {
  return new Date(iso.replace(/(\.\d{3})\d+/, '$1'));
}

function paraConversa(api: ConversaResumoApi): Omit<Conversa, 'mensagens' | 'carregada'> {
  return {
    id: api.id,
    titulo: api.titulo,
    area: paraArea(api.area),
    atualizadaEm: paraData(api.atualizadaEm),
  };
}

function paraMensagem(api: MensagemApi, area: AreaEnem | null): Mensagem {
  if (api.autor === 'aluno') {
    return { autor: 'aluno', texto: api.texto ?? '' };
  }
  const passos: PassoResposta[] = api.passos.map(p => ({
    titulo: p.titulo,
    conteudo: p.conteudo,
    ...(p.formula ? { formula: p.formula } : {}),
  }));
  return {
    autor: 'ia',
    passosVisiveis: passos.length, // no histórico, todos os passos já aparecem
    tenteVoceAberto: false,
    resposta: {
      area,
      topico: api.topico,
      modo: (api.modo as ModoAjuda | null) ?? 'explicar',
      passos,
      tenteVoce: api.tenteVoce
        ? { pergunta: api.tenteVoce.pergunta ?? '', resposta: api.tenteVoce.resposta ?? '' }
        : null,
      cotaRestante: COTA_DIARIA,
    },
  };
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
