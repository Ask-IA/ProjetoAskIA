// src/app/services/ask-ia.service.ts
//
// Ask IA: estado das conversas + chamadas à IA.
//
// 1) HISTÓRICO (REAL, vem do backend)
//    As conversas são carregadas de GET /api/conversas. Cada pergunta é
//    enviada e já volta com a resposta da IA e o histórico salvo, num único
//    POST /api/ia/perguntar — o backend valida a cota, chama a IA (OpenAI,
//    via IaService) e grava a interação, tudo numa só ida ao servidor.
//    O estado vive aqui, e não no componente, para a conversa não sumir quando o
//    aluno vai ao Painel e volta. Ele é ZERADO ao sair/trocar de conta (limpar()).
//
// 2) COTA DIÁRIA (REAL, POR USUÁRIO)
//    Quem conta e barra é o BACKEND: GET /api/conversas/cota diz quantas perguntas
//    restam hoje e o POST /perguntar responde 429 quando acabam (a cota é checada
//    ANTES de chamar o modelo, pra não gastar uma chamada de API à toa). A conta é
//    feita sobre as perguntas que o próprio usuário gravou, então cada conta tem a sua.
//
// 3) IA (REAL — OpenAI via Spring AI, do lado do backend)
//    O contrato da resposta (area, topico, passos[].formula, termos-chave entre
//    ==sinais de igual==, tenteVoce) é pedido no prompt do IaService e chega pronto
//    aqui, já no formato de RespostaIA — este arquivo só faz a conversão de tipos.
//
// TODO: trocar a biblioteca de Markdown + fórmulas (ex.: ngx-markdown + KaTeX) pra
// as fórmulas pararem de aparecer como texto puro. Quando entrar, cada fórmula vai
// num bloco com overflow-x: auto para não estourar a largura no celular.

import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
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

// ---- Formatos que o backend devolve ----

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

/** Resposta estruturada da IA, como o IaController (backend) devolve. */
interface RespostaIaApi {
  area: string | null;
  topico: string | null;
  passos: { titulo: string; conteudo: string; formula: string | null }[];
  tenteVoce: { pergunta: string; resposta: string } | null;
}

/** POST /api/ia/perguntar: a conversa, a resposta da IA e a cota, numa só ida ao servidor. */
interface PerguntarApi {
  conversa: ConversaResumoApi;
  resposta: RespostaIaApi;
  cotaRestante: number;
}

export const COTA_DIARIA = 10;

/** Quantas conversas a lista traz de uma vez (o backend aceita até 50). */
const TAMANHO_DA_LISTA = 50;

@Injectable({ providedIn: 'root' })
export class AskIaService {
  private http = inject(HttpClient);
  private readonly api = `${environment.apiUrl}/api/conversas`;
  private readonly apiIa = `${environment.apiUrl}/api/ia`;

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
   * Envia a pergunta para a IA de verdade e já recebe de volta a resposta +
   * a conversa salva + a cota atualizada, num único POST /api/ia/perguntar.
   * A conversa é "capturada" no envio: se o aluno trocar de tela ou de
   * conversa enquanto a IA pensa, a resposta cai no lugar em que foi pedida.
   * Cancelar (unsubscribe) ou falhar (IA indisponível, 429, etc.) tira a
   * pergunta da conversa. A resposta só aparece na tela depois de salva no
   * servidor: o que se vê é o que está no histórico.
   */
  enviarPergunta(texto: string, modo: ModoAjuda): Observable<RespostaIA> {
    const conversaId = this.registrarPergunta(texto);
    this.aguardando.set(conversaId);

    const corpo = {
      conversaId: conversaId > 0 ? conversaId : null, // id negativo = conversa nova
      modo,
      pergunta: texto,
    };

    return this.http.post<PerguntarApi>(`${this.apiIa}/perguntar`, corpo).pipe(
      tap({
        next: api => {
          const idReal = this.confirmarConversa(conversaId, api.conversa);
          this.registrarResposta(idReal, paraRespostaIA(api.resposta, modo, api.cotaRestante));
        },
        error: () => this.removerUltimaPergunta(conversaId),
        unsubscribe: () => this.removerUltimaPergunta(conversaId),
        finalize: () => this.aguardando.set(null),
      }),
      map(api => paraRespostaIA(api.resposta, modo, api.cotaRestante))
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

  // ================= 2) Cota diária =================

  /** Quantas perguntas o usuário logado ainda pode fazer hoje (GET /api/conversas/cota). */
  cotaRestante(): Observable<number> {
    return this.http.get<{ limite: number; usadas: number; restantes: number }>(`${this.api}/cota`).pipe(
      map(cota => cota.restantes)
    );
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

/** Resposta real da IA (POST /api/ia/perguntar) → formato que a tela usa. */
function paraRespostaIA(api: RespostaIaApi, modo: ModoAjuda, cotaRestante: number): RespostaIA {
  const passos: PassoResposta[] = api.passos.map(p => ({
    titulo: p.titulo,
    conteudo: p.conteudo,
    ...(p.formula ? { formula: p.formula } : {}),
  }));
  return {
    area: paraArea(api.area),
    topico: api.topico,
    modo,
    passos,
    tenteVoce: api.tenteVoce ? { pergunta: api.tenteVoce.pergunta, resposta: api.tenteVoce.resposta } : null,
    cotaRestante,
  };
}

// ================= auxiliares =================

/** Mesma regra do backend (ConversaService.resumirTitulo): junta espaços e corta em ~42 caracteres com reticências. */
function resumirTitulo(pergunta: string): string {
  const limpo = pergunta.replace(/\s+/g, ' ').trim();
  return limpo.length > 42 ? limpo.slice(0, 40).trimEnd() + '…' : limpo;
}
