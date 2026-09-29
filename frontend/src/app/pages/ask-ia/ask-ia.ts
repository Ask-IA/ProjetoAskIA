// src/app/pages/ask-ia/ask-ia.ts
//
// Tela principal do produto: conversa com a IA (ainda com DADOS FALSOS).
//
// O que mudou no redesenho (diagnóstico de 23/09 + padrão visual de 24/09):
// - resposta com etiqueta da área, número do passo na cor da área e
//   marca-texto nos termos-chave;
// - três modos: Explicar (padrão), Resolver (um passo por vez, com
//   "Tentei, mostrar o próximo") e Plano;
// - "Tente você" no fim da resposta;
// - campo fixo embaixo, com o contador de perguntas colado nele;
// - espera com texto depois de 4 s e opção de Cancelar depois de 12 s;
// - conversas recentes (a conversa não some mais ao trocar de tela);
// - limite do dia com o próximo passo clicável, sem esconder a conversa
//   (reler o que a IA já respondeu não gasta cota).
//
// Estado em signals: o app é zoneless, e só o signal avisa o Angular para
// redesenhar quando algo muda fora de um clique (resposta da IA, cota, erro).
// Até o texto do campo virou signal, porque ele é limpo dentro de um subscribe.

import {
  Component, ElementRef, Injector, OnDestroy, OnInit, afterNextRender, computed, inject, signal, viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AskIaService, COTA_DIARIA, ModoAjuda, NOME_MODO } from '../../services/ask-ia.service';
import { EstudosService } from '../../services/estudos.service';
import { RevisaoService } from '../../services/revisao.service';
import { Icone } from '../../shared/icone';
import { LimiteDiario } from './limite-diario';
import { ListaConversas } from './lista-conversas/lista-conversas';
import { RespostaIa } from './resposta-ia/resposta-ia';

// Curtas de propósito: no celular o campo tem uns 30 caracteres de largura
const DICA_DO_CAMPO: Record<ModoAjuda, string> = {
  explicar: 'Escreva sua dúvida…',
  resolver: 'Cole aqui o exercício…',
  plano: 'O que você precisa estudar?',
};

const TEXTO_DE_ESPERA: Record<ModoAjuda, string> = {
  explicar: 'Montando a explicação passo a passo…',
  resolver: 'Separando a resolução em passos…',
  plano: 'Montando o seu plano de estudo…',
};

@Component({
  selector: 'app-ask-ia',
  standalone: true,
  imports: [FormsModule, Icone, LimiteDiario, ListaConversas, RespostaIa],
  templateUrl: './ask-ia.html',
  styleUrl: './ask-ia.css',
})
export class AskIa implements OnInit, OnDestroy {
  private service = inject(AskIaService);
  private estudos = inject(EstudosService);
  private revisao = inject(RevisaoService);
  private rota = inject(ActivatedRoute);
  private router = inject(Router);
  private injector = inject(Injector);

  private campo = viewChild<ElementRef<HTMLTextAreaElement>>('campoPergunta');
  private rolagem = viewChild<ElementRef<HTMLElement>>('rolagem');

  readonly cotaTotal = COTA_DIARIA;
  readonly horarioReinicio = this.service.horarioReinicio();
  readonly modos: ModoAjuda[] = ['explicar', 'resolver', 'plano'];
  readonly nomeModo = NOME_MODO;

  readonly exemplos = [
    'Me explique função afim com um exemplo',
    'Como usar crase corretamente?',
    'O que foi a Era Vargas?',
  ];

  pergunta = signal('');
  modo = signal<ModoAjuda>('explicar');
  erro = signal('');
  limiteAtingido = signal(false);
  cotaRestante = signal<number | null>(null);
  mostrarHistorico = signal(false);
  /** 0 = pensando; 1 = passou de 4 s (mostra texto); 2 = passou de 12 s (oferece Cancelar) */
  fasePensando = signal<0 | 1 | 2>(0);
  /** Frase lida pelo leitor de tela quando a resposta chega. */
  anuncio = signal('');

  // Bloco "Hoje", no canto direito
  ofensiva = signal<number | null>(null);
  cartoesParaRevisar = signal(0);

  readonly conversa = this.service.atual;
  readonly carregandoConversa = this.service.carregandoConversa;
  readonly erroConversa = this.service.erroConversa;
  readonly erroLista = this.service.erroLista;
  readonly recentes = computed(() => this.service.recentes().slice(0, 6));
  readonly mensagens = computed(() => this.conversa()?.mensagens ?? []);
  readonly carregando = computed(() => this.service.aguardando() !== null);
  /** Não deixa perguntar enquanto a IA responde OU enquanto uma conversa antiga ainda está abrindo. */
  readonly bloqueado = computed(() => this.carregando() || this.service.carregandoConversa());
  readonly pensandoAqui = computed(() => {
    const id = this.service.aguardando();
    return id !== null && id === this.conversa()?.id;
  });
  readonly cotaBaixa = computed(() => (this.cotaRestante() ?? COTA_DIARIA) <= 2);
  readonly dicaDoCampo = computed(() => DICA_DO_CAMPO[this.modo()]);
  readonly textoDeEspera = computed(() => TEXTO_DE_ESPERA[this.modo()]);

  private pedido?: Subscription;
  private temporizadores: ReturnType<typeof setTimeout>[] = [];

  ngOnInit(): void {
    // Histórico real: sempre busca ao entrar (o serviço junta com o que já está na tela)
    this.service.carregarConversas();

    this.service.cotaRestante().subscribe({
      next: restante => {
        this.cotaRestante.set(restante);
        this.limiteAtingido.set(restante <= 0);
      },
      error: () => this.erro.set('Não foi possível verificar sua cota de hoje.'),
    });

    // Links que chegam de outras telas:
    // ?conversa=12  → abre a conversa (botão "Continuar" do Painel)
    // ?pergunta=... → já deixa a dúvida escrita ("Onde focar agora")
    const parametros = this.rota.snapshot.queryParamMap;
    const conversaId = Number(parametros.get('conversa'));
    if (conversaId) this.service.abrir(conversaId, () => this.rolarAoAbrir());
    const perguntaPronta = parametros.get('pergunta');
    if (perguntaPronta) {
      this.service.nova();
      this.pergunta.set(perguntaPronta);
    }
    if (parametros.keys.length > 0) {
      // limpa a URL: um F5 depois não deve reabrir nem reescrever nada
      this.router.navigate([], { relativeTo: this.rota, queryParams: {}, replaceUrl: true });
    }

    // Se a IA ainda está respondendo (o aluno saiu e voltou), a espera continua
    if (this.carregando()) this.iniciarAvisosDeEspera();

    this.estudos.ofensiva().subscribe({
      next: dias => this.ofensiva.set(dias),
      error: () => this.ofensiva.set(null), // sem backend: o bloco só não mostra a linha
    });
    this.revisao.listarFlashcards().subscribe(cartoes => this.cartoesParaRevisar.set(cartoes.length));

    afterNextRender(() => {
      this.rolarParaFim('auto');
      // Foco automático só com mouse: no celular, o teclado subiria e
      // esconderia os exemplos logo na abertura.
      if (matchMedia('(pointer: fine)').matches) this.campo()?.nativeElement.focus();
    }, { injector: this.injector });
  }

  ngOnDestroy(): void {
    // O pedido NÃO é cancelado ao sair da tela: a resposta chega e fica
    // guardada na conversa. Só os avisos de espera param.
    this.limparTemporizadores();
  }

  escolherModo(modo: ModoAjuda): void {
    this.modo.set(modo);
  }

  usarExemplo(texto: string): void {
    this.pergunta.set(texto);
    this.campo()?.nativeElement.focus();
  }

  aoApertarEnter(evento: Event): void {
    // Enter envia; Shift+Enter pula linha. isComposing: teclado com acentuação em andamento.
    const tecla = evento as KeyboardEvent;
    if (tecla.shiftKey || tecla.isComposing) return;
    tecla.preventDefault();
    this.enviar();
  }

  enviar(): void {
    const texto = this.pergunta().trim();
    if (!texto || this.bloqueado() || this.limiteAtingido()) return;

    this.erro.set('');
    this.anuncio.set('');
    this.mostrarHistorico.set(false);
    this.iniciarAvisosDeEspera();

    this.pedido = this.service.enviarPergunta(texto, this.modo()).subscribe({
      next: resposta => {
        this.limparTemporizadores();
        this.cotaRestante.set(resposta.cotaRestante);
        this.pergunta.set(''); // só limpa quando deu certo
        this.anuncio.set(`Resposta pronta, em ${resposta.passos.length} passos.`);
        this.rolarParaUltimaResposta();
      },
      error: (err: { status?: number }) => {
        this.limparTemporizadores();
        if (err?.status === 429) {
          this.limiteAtingido.set(true);
          this.cotaRestante.set(0);
          return;
        }
        // Estado de erro: o texto digitado CONTINUA no campo
        this.erro.set('Não foi possível obter a resposta agora. Sua pergunta continua no campo: é só enviar de novo.');
      },
    });

    afterNextRender(() => this.rolarParaFim(), { injector: this.injector });
  }

  /**
   * Cancelar só para de esperar e devolve a pergunta ao campo.
   * Com o backend real, se a IA já tiver respondido no servidor, a pergunta
   * pode contar na cota — combinar esse detalhe com o João.
   */
  cancelar(): void {
    this.pedido?.unsubscribe();
    this.limparTemporizadores();
    this.service.cotaRestante().subscribe(restante => this.cotaRestante.set(restante));
    this.campo()?.nativeElement.focus();
  }

  novaConversa(): void {
    this.service.nova();
    this.erro.set('');
    this.mostrarHistorico.set(false);
    this.campo()?.nativeElement.focus();
  }

  abrirConversa(id: number): void {
    this.erro.set('');
    this.mostrarHistorico.set(false);
    // se a conversa ainda não foi baixada, o serviço chama de volta quando ela chegar
    this.service.abrir(id, () => this.rolarAoAbrir());
  }

  alternarHistorico(): void {
    this.mostrarHistorico.update(valor => !valor);
  }

  // ---------- auxiliares ----------

  private iniciarAvisosDeEspera(): void {
    this.limparTemporizadores();
    this.fasePensando.set(0);
    // Acima de 1 s a pessoa percebe a espera; acima de 10 s acha que travou (Nielsen).
    this.temporizadores = [
      setTimeout(() => this.fasePensando.set(1), 4000),
      setTimeout(() => this.fasePensando.set(2), 12000),
    ];
  }

  private limparTemporizadores(): void {
    this.temporizadores.forEach(clearTimeout);
    this.temporizadores = [];
    this.fasePensando.set(0);
  }

  private rolarAoAbrir(): void {
    afterNextRender(() => this.rolarParaFim('auto'), { injector: this.injector });
  }

  private rolarParaFim(comportamento: ScrollBehavior = 'smooth'): void {
    const area = this.rolagem()?.nativeElement;
    area?.scrollTo({ top: area.scrollHeight, behavior: this.suavidade(comportamento) });
  }

  /** A resposta chegou: rola até o passo 1 dela, e não até o fim. */
  private rolarParaUltimaResposta(): void {
    afterNextRender(() => {
      const respostas = this.rolagem()?.nativeElement.querySelectorAll<HTMLElement>('.resposta');
      const ultima = respostas?.[respostas.length - 1];
      ultima?.scrollIntoView({ block: 'start', behavior: this.suavidade('smooth') });
    }, { injector: this.injector });
  }

  private suavidade(comportamento: ScrollBehavior): ScrollBehavior {
    return matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : comportamento;
  }
}
