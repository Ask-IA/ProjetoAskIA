// src/app/pages/materias/materias.ts
//
// Matérias, tópicos e o Temporizador de Estudos.
// Estado em signals: o app é zoneless. Sem isso, a lista só aparecia depois de
// um clique qualquer, e o temporizador ficaria parado em 25:00 na tela mesmo
// contando por baixo dos panos (o setInterval não avisa o Angular sozinho).

import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { EstudosService, Materia } from '../../services/estudos.service';

@Component({
  selector: 'app-materias',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './materias.html',
  styleUrl: './materias.css',
})
export class Materias implements OnInit, OnDestroy {
  private estudos = inject(EstudosService);

  materias = signal<Materia[]>([]);
  selecionada = signal<Materia | null>(null);
  carregando = signal(true);
  erro = signal('');

  // ligados ao [(ngModel)] — digitar já dispara o redesenho
  novaMateria = '';
  novoTopico = '';

  // ----- Temporizador (pomodoro 25min) -----
  readonly duracaoPadrao = 25 * 60;
  segundosRestantes = signal(this.duracaoPadrao);
  rodando = signal(false);
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
    const nome = this.novaMateria.trim();
    if (!nome) return;
    this.estudos.adicionarMateria(nome).subscribe({
      next: () => {
        this.novaMateria = '';
        this.carregar(true);
      },
      error: () => this.erro.set('Não foi possível cadastrar a matéria.'),
    });
  }

  adicionarTopico(): void {
    const nome = this.novoTopico.trim();
    const materia = this.selecionada();
    if (!nome || !materia) return;

    this.estudos.adicionarTopico(materia.id, nome).subscribe({
      next: () => {
        this.novoTopico = '';
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

  removerTopico(topicoId: number): void {
    const materia = this.selecionada();
    if (!materia) return;
    this.estudos.removerTopico(materia.id, topicoId).subscribe({
      next: () => this.carregar(true),
      error: () => this.erro.set('Não foi possível remover o tópico.'),
    });
  }

  // ----- Temporizador -----

  comecar(): void {
    if (this.rodando()) return;
    this.rodando.set(true);
    this.intervalo = setInterval(() => {
      if (this.segundosRestantes() > 0) {
        this.segundosRestantes.update(s => s - 1);
      } else {
        this.pausar();
        // TODO (melhoria futura): ao zerar, oferecer registrar a sessão
        // automaticamente no Cronograma.
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
  }
}
