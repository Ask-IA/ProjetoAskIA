// src/app/pages/materias/materias.ts
//
// Cadastro de matérias e tópicos (mockup "Suas Matérias") com DADOS FALSOS.
// Inclui o Temporizador de Estudos (25:00) do protótipo.

import { Component, OnDestroy, OnInit, inject } from '@angular/core';
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

  materias: Materia[] = [];
  selecionada: Materia | null = null;

  novaMateria = '';
  novoTopico = '';

  // ----- Temporizador (pomodoro 25min) -----
  readonly duracaoPadrao = 25 * 60;
  segundosRestantes = this.duracaoPadrao;
  rodando = false;
  private intervalo?: ReturnType<typeof setInterval>;

  ngOnInit(): void {
    this.carregar();
  }

  ngOnDestroy(): void {
    clearInterval(this.intervalo);
  }

  private carregar(manterSelecao = false): void {
    const idSelecionada = this.selecionada?.id;
    this.estudos.listarMaterias().subscribe(lista => {
      this.materias = lista;
      this.selecionada = manterSelecao
        ? lista.find(m => m.id === idSelecionada) ?? lista[0] ?? null
        : lista[0] ?? null;
    });
  }

  selecionar(materia: Materia): void {
    this.selecionada = materia;
  }

  adicionarMateria(): void {
    const nome = this.novaMateria.trim();
    if (!nome) return;
    this.estudos.adicionarMateria(nome).subscribe(() => {
      this.novaMateria = '';
      this.carregar(true);
    });
  }

  adicionarTopico(): void {
    const nome = this.novoTopico.trim();
    if (!nome || !this.selecionada) return;
    this.estudos.adicionarTopico(this.selecionada.id, nome).subscribe(() => {
      this.novoTopico = '';
      this.carregar(true);
    });
  }

  alternarTopico(topicoId: number): void {
    if (!this.selecionada) return;
    this.estudos.alternarTopico(this.selecionada.id, topicoId).subscribe(() => this.carregar(true));
  }

  removerTopico(topicoId: number): void {
    if (!this.selecionada) return;
    this.estudos.removerTopico(this.selecionada.id, topicoId).subscribe(() => this.carregar(true));
  }

  // ----- Temporizador -----

  get tempoFormatado(): string {
    const m = Math.floor(this.segundosRestantes / 60);
    const s = this.segundosRestantes % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  comecar(): void {
    if (this.rodando) return;
    this.rodando = true;
    this.intervalo = setInterval(() => {
      if (this.segundosRestantes > 0) {
        this.segundosRestantes--;
      } else {
        this.pausar();
        // TODO (melhoria futura): ao zerar, oferecer registrar a sessão
        // automaticamente no Cronograma.
      }
    }, 1000);
  }

  pausar(): void {
    this.rodando = false;
    clearInterval(this.intervalo);
  }

  zerar(): void {
    this.pausar();
    this.segundosRestantes = this.duracaoPadrao;
  }
}
