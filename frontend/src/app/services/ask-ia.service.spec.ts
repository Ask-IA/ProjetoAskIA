import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AskIaService } from './ask-ia.service';
import { environment } from '../../environments/environment';

const API = `${environment.apiUrl}/api/conversas`;

describe('AskIaService (histórico real)', () => {
  let service: AskIaService;
  let http: HttpTestingController;

  beforeEach(() => {
    vi.useFakeTimers(); // o mock da IA usa delay()
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(AskIaService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const resumo = (id: number, titulo = 'Quando usar crase?') => ({
    id, titulo, area: 'linguagens', criadaEm: '2026-09-29T22:00:00.123456Z', atualizadaEm: '2026-09-29T22:00:00.123456Z',
  });

  it('carrega a lista e não traz mensagens até abrir a conversa', () => {
    service.carregarConversas();
    const req = http.expectOne(r => r.url === API && r.params.get('page') === '0');
    req.flush({ conteudo: [resumo(7)], pagina: 0, tamanho: 50, totalElementos: 1, totalPaginas: 1, ultima: true });

    expect(service.conversas().length).toBe(1);
    expect(service.conversas()[0].carregada).toBe(false);
    expect(service.conversas()[0].area).toBe('linguagens');
    expect(Number.isNaN(service.conversas()[0].atualizadaEm.getTime())).toBe(false);
  });

  it('abrir busca as mensagens no servidor e monta a resposta da IA', () => {
    service.carregarConversas();
    http.expectOne(r => r.url === API).flush({ conteudo: [resumo(7)], pagina: 0, tamanho: 50, totalElementos: 1, totalPaginas: 1, ultima: true });

    const aoCarregar = vi.fn();
    service.abrir(7, aoCarregar);
    expect(service.carregandoConversa()).toBe(true);

    http.expectOne(`${API}/7`).flush({
      ...resumo(7),
      mensagens: [
        { id: 1, autor: 'aluno', modo: 'explicar', texto: 'Quando usar crase?', topico: null, passos: [], tenteVoce: null, criadaEm: '2026-09-29T22:00:00Z' },
        { id: 2, autor: 'ia', modo: 'explicar', texto: null, topico: 'Crase',
          passos: [{ titulo: 'O que é', conteudo: 'Fusão de a + a', formula: null }],
          tenteVoce: { pergunta: 'Vai crase?', resposta: 'Sim' }, criadaEm: '2026-09-29T22:00:01Z' },
      ],
    });

    const conversa = service.atual()!;
    expect(service.carregandoConversa()).toBe(false);
    expect(aoCarregar).toHaveBeenCalled();
    expect(conversa.carregada).toBe(true);
    expect(conversa.mensagens.length).toBe(2);
    const ia = conversa.mensagens[1];
    expect(ia.autor === 'ia' && ia.resposta.passos[0].formula).toBeUndefined();
    expect(ia.autor === 'ia' && ia.passosVisiveis).toBe(1);
  });

  it('pergunta nova: salva no backend e troca o id provisório pelo real', () => {
    let recebida: unknown;
    service.enviarPergunta('Como usar crase corretamente?', 'explicar').subscribe(r => (recebida = r));
    expect(service.idAtual()).toBeLessThan(0); // provisório
    expect(service.aguardando()).toBe(service.idAtual());

    vi.advanceTimersByTime(2000); // a IA de mentira responde

    const req = http.expectOne(`${API}/interacoes`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body.conversaId).toBeNull();
    expect(req.request.body.modo).toBe('explicar');
    expect(req.request.body.pergunta).toBe('Como usar crase corretamente?');
    expect(req.request.body.resposta.passos.length).toBeGreaterThan(0);
    expect(recebida).toBeUndefined(); // ainda não: só aparece depois de salvar

    req.flush(resumo(42, 'Como usar crase corretamente?'));

    expect(recebida).toBeDefined();
    expect(service.idAtual()).toBe(42);
    expect(service.aguardando()).toBeNull();
    expect(service.conversas().map(c => c.id)).toEqual([42]);
    expect(service.atual()!.mensagens.length).toBe(2); // pergunta + resposta
  });

  it('pergunta em conversa existente envia o conversaId real', () => {
    service.carregarConversas();
    http.expectOne(r => r.url === API).flush({ conteudo: [resumo(7)], pagina: 0, tamanho: 50, totalElementos: 1, totalPaginas: 1, ultima: true });
    service.abrir(7);
    http.expectOne(`${API}/7`).flush({ ...resumo(7), mensagens: [] });

    service.enviarPergunta('Outra dúvida', 'resolver').subscribe();
    vi.advanceTimersByTime(2000);
    const req = http.expectOne(`${API}/interacoes`);
    expect(req.request.body.conversaId).toBe(7);
    req.flush(resumo(7));
    expect(service.conversas().length).toBe(1);
  });

  it('se falhar ao salvar, a pergunta some da conversa (nada de histórico pela metade)', () => {
    let falhou = false;
    service.enviarPergunta('Me explique função afim', 'explicar').subscribe({ error: () => (falhou = true) });
    vi.advanceTimersByTime(2000);
    http.expectOne(`${API}/interacoes`).flush({ message: 'x' }, { status: 500, statusText: 'Erro' });

    expect(falhou).toBe(true);
    expect(service.conversas().length).toBe(0);
    expect(service.idAtual()).toBeNull();
    expect(service.aguardando()).toBeNull();
  });

  it('limpar() esquece tudo e descarta respostas atrasadas da conta anterior', () => {
    service.carregarConversas();
    const pendente = http.expectOne(r => r.url === API);

    service.limpar(); // logout / troca de conta enquanto a lista ainda carregava
    pendente.flush({ conteudo: [resumo(7)], pagina: 0, tamanho: 50, totalElementos: 1, totalPaginas: 1, ultima: true });

    expect(service.conversas().length).toBe(0); // a resposta da conta antiga foi ignorada
    expect(service.carregandoLista()).toBe(false);
  });

  it('limpar() zera as conversas já carregadas', () => {
    service.carregarConversas();
    http.expectOne(r => r.url === API).flush({ conteudo: [resumo(7)], pagina: 0, tamanho: 50, totalElementos: 1, totalPaginas: 1, ultima: true });
    service.abrir(7);
    http.expectOne(`${API}/7`).flush({ ...resumo(7), mensagens: [] });

    service.limpar();
    expect(service.conversas()).toEqual([]);
    expect(service.idAtual()).toBeNull();
  });

  it('404 ao abrir (conversa de outro usuário) volta para o estado vazio', () => {
    service.abrir(999);
    http.expectOne(`${API}/999`).flush({ message: 'Conversa não encontrada.' }, { status: 404, statusText: 'Not Found' });
    expect(service.idAtual()).toBeNull();
    expect(service.erroConversa()).toBe('');
  });
});
