// src/app/pages/materias/materias.ts
//
// Matérias, tópicos e o Temporizador de Estudos.
// Estado em signals: o app é zoneless. Sem isso, a lista só aparecia depois de
// um clique qualquer, e o temporizador ficaria parado em 25:00 na tela mesmo
// contando por baixo dos panos (o setInterval não avisa o Angular sozinho).
//
// Mudanças de 24/09:
// - cor da matéria = cor da ÁREA do ENEM, sempre com o nome da área escrito;
// - remover tópico tem "Desfazer" por 5 s (toque acidental é comum no celular);
// - quando o temporizador termina, oferece registrar a sessão no Cronograma.
//   Antes os 25 minutos se perdiam e o aluno tinha de digitar de novo lá.

import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { EstudosService, Materia, Topico } from '../../services/estudos.service';
import { AreaEnem, NOME_AREA, areaDaMateria, classeArea } from '../../core/areas';
import { Icone } from '../../shared/icone';

interface RemocaoPendente {
  materiaId: number;
  topico: Topico;
}

@Component({
  selector: 'app-materias',
  standalone: true,
  imports: [FormsModule, Icone],
  templateUrl: './materias.html',
  styleUrl: './materias.css',
  host: { class: 'pagina' },
})
export class Materias implements OnInit, OnDestroy {
  private estudos = inject(EstudosService);

  readonly classeArea = classeArea;

  materias = signal<Materia[]>([]);
  selecionada = signal<Materia | null>(null);
  carregando = signal(true);
  erro = signal('');

  // campos dos formulários (signals porque são limpos dentro de um subscribe)
  novaMateria = signal('');
  novoTopico = signal('');

  removendo = signal<RemocaoPendente | null>(null);
  private temporizadorRemocao?: ReturnType<typeof setTimeout>;

  readonly topicosVisiveis = computed(() => {
    const pendente = this.removendo();
    return (this.selecionada()?.topicos ?? []).filter(t => t.id !== pendente?.topico.id);
  });

  // ----- Temporizador (pomodoro 25min) -----
  readonly duracaoPadrao = 25 * 60;
  segundosRestantes = signal(this.duracaoPadrao);
  rodando = signal(false);
  /** A matéria fica "presa" ao temporizador quando ele começa. */
  materiaDoTemporizador = signal<Materia | null>(null);
  terminou = signal(false);
  sessaoRegistrada = signal('');
  private intervalo?: ReturnType<typeof setInterval>;

  tempoFormatado = computed(() => {
    const m = Math.floor(this.segundosRestantes() / 60);
    const s = this.segundosRestantes() % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  });

  ngOnInit(): void {
    this.carregar();
  }

  ngOnDestroy(): void {
    clearInterval(this.intervalo);
    this.confirmarRemocao(); // saiu da tela com um "Desfazer" aberto: a remoção vale
  }

  area(materia: Materia): AreaEnem | null {
    return areaDaMateria(materia.nome);
  }

  nomeArea(materia: Materia): string {
    const area = this.area(materia);
    return area ? NOME_AREA[area] : 'Área não identificada';
  }

  carregar(manterSelecao = false): void {
    const idSelecionada = this.selecionada()?.id;
    this.erro.set('');

    this.estudos.listarMaterias().subscribe({
      next: lista => {
        this.materias.set(lista);
        this.selecionada.set(
          manterSelecao
            ? lista.find(m => m.id === idSelecionada) ?? lista[0] ?? null
            : lista[0] ?? null
        );
        this.carregando.set(false);
      },
      error: () => {
        this.carregando.set(false);
        this.erro.set('Não foi possível carregar suas matérias.');
      },
    });
  }

  selecionar(materia: Materia): void {
    this.selecionada.set(materia);
  }

  adicionarMateria(): void {
    const nome = this.novaMateria().trim();
    if (!nome) return;
    this.estudos.adicionarMateria(nome).subscribe({
      next: () => {
        this.novaMateria.set('');
        this.carregar(true);
      },
      error: () => this.erro.set('Não foi possível cadastrar a matéria.'),
    });
  }

  adicionarTopico(): void {
    const nome = this.novoTopico().trim();
    const materia = this.selecionada();
    if (!nome || !materia) return;

    this.estudos.adicionarTopico(materia.id, nome).subscribe({
      next: () => {
        this.novoTopico.set('');
        this.carregar(true);
      },
      error: () => this.erro.set('Não foi possível adicionar o tópico.'),
    });
  }

  alternarTopico(topicoId: number): void {
    const materia = this.selecionada();
    if (!materia) return;
    this.estudos.alternarTopico(materia.id, topicoId).subscribe({
      next: () => this.carregar(true),
      error: () => this.erro.set('Não foi possível atualizar o tópico.'),
    });
  }

  // ----- Remover com "Desfazer" -----

  removerTopico(topico: Topico): void {
    const materia = this.selecionada();
    if (!materia) return;
    this.confirmarRemocao(); // se já havia outra pendente, ela vale agora
    this.removendo.set({ materiaId: materia.id, topico });
    this.temporizadorRemocao = setTimeout(() => this.confirmarRemocao(), 5000);
  }

  desfazerRemocao(): void {
    clearTimeout(this.temporizadorRemocao);
    this.removendo.set(null);
  }

  private confirmarRemocao(): void {
    const pendente = this.removendo();
    if (!pendente) return;
    clearTimeout(this.temporizadorRemocao);
    this.removendo.set(null);
    this.estudos.removerTopico(pendente.materiaId, pendente.topico.id).subscribe({
      next: () => this.carregar(true),
      error: () => this.erro.set('Não foi possível remover o tópico.'),
    });
  }

  // ----- Temporizador -----

  comecar(): void {
    if (this.rodando()) return;
    if (!this.materiaDoTemporizador()) this.materiaDoTemporizador.set(this.selecionada());
    this.terminou.set(false);
    this.sessaoRegistrada.set('');
    this.rodando.set(true);
    this.intervalo = setInterval(() => {
      if (this.segundosRestantes() > 1) {
        this.segundosRestantes.update(s => s - 1);
      } else {
        this.segundosRestantes.set(0);
        this.pausar();
        this.terminou.set(true);
      }
    }, 1000);
  }

  pausar(): void {
    this.rodando.set(false);
    clearInterval(this.intervalo);
  }

  zerar(): void {
    this.pausar();
    this.segundosRestantes.set(this.duracaoPadrao);
    this.materiaDoTemporizador.set(null);
    this.terminou.set(false);
  }

  /** Terminou os 25 min: registra a sessão direto no Cronograma. */
  registrarSessao(): void {
    const materia = this.materiaDoTemporizador();
    if (!materia) return;
    const minutos = Math.round(this.duracaoPadrao / 60);

    this.estudos.registrarSessao({ materiaId: materia.id, minutos, anotacoes: 'Temporizador' }).subscribe({
      next: () => {
        this.sessaoRegistrada.set(`${minutos} min de ${materia.nome} registrados no Cronograma.`);
        this.zerar();
      },
      error: () => this.erro.set('Não foi possível registrar a sessão.'),
    });
  }
}
