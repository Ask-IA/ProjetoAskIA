// src/app/pages/cronograma/cronograma.ts
//
// Metas semanais + registro de sessões de estudo.
// Listas em signals (app zoneless): sem isso, o que vem do backend não
// aparecia até um clique qualquer na tela.

import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import {
  DiaSemana, EstudosService, Materia, Meta, SessaoEstudo,
} from '../../services/estudos.service';

@Component({
  selector: 'app-cronograma',
  standalone: true,
  imports: [FormsModule, DatePipe],
  templateUrl: './cronograma.html',
  styleUrl: './cronograma.css',
})
export class Cronograma implements OnInit {
  private estudos = inject(EstudosService);

  readonly dias: DiaSemana[] = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

  materias = signal<Materia[]>([]);
  metas = signal<Meta[]>([]);
  sessoes = signal<SessaoEstudo[]>([]);
  erro = signal('');

  // formulário de meta (ligados ao ngModel)
  metaMateriaId: number | null = null;
  metaDia: DiaSemana = 'Segunda';
  metaHora = '';
  metaDescricao = '';

  // formulário de sessão
  sessaoMateriaId: number | null = null;
  sessaoMinutos = 30;
  sessaoAnotacoes = '';

  ngOnInit(): void {
    this.estudos.listarMaterias().subscribe({
      next: m => this.materias.set(m),
      error: () => this.erro.set('Não foi possível carregar suas matérias.'),
    });
    this.carregarMetas();
    this.carregarSessoes();
  }

  private carregarMetas(): void {
    this.estudos.listarMetas().subscribe({
      next: m => this.metas.set(m),
      error: () => this.erro.set('Não foi possível carregar suas metas.'),
    });
  }

  private carregarSessoes(): void {
    this.estudos.listarSessoes().subscribe({
      next: s => this.sessoes.set(s),
      error: () => this.erro.set('Não foi possível carregar suas sessões.'),
    });
  }

  metasDoDia(dia: DiaSemana): Meta[] {
    return this.metas()
      .filter(m => m.dia === dia)
      .sort((a, b) => a.hora.localeCompare(b.hora));
  }

  nomeMateria(id: number): string {
    return this.materias().find(m => m.id === id)?.nome ?? '—';
  }

  adicionarMeta(): void {
    if (this.metaMateriaId === null || !this.metaHora) return;
    this.erro.set('');

    this.estudos.adicionarMeta({
      materiaId: Number(this.metaMateriaId),
      dia: this.metaDia,
      hora: this.metaHora,
      descricao: this.metaDescricao.trim() || undefined,
    }).subscribe({
      next: () => {
        this.metaHora = '';
        this.metaDescricao = '';
        this.carregarMetas();
      },
      error: err => this.erro.set(err?.error?.message ?? 'Não foi possível criar a meta.'),
    });
  }

  removerMeta(id: number): void {
    this.estudos.removerMeta(id).subscribe({
      next: () => this.carregarMetas(),
      error: () => this.erro.set('Não foi possível remover a meta.'),
    });
  }

  registrarSessao(): void {
    if (this.sessaoMateriaId === null || this.sessaoMinutos <= 0) return;
    this.erro.set('');

    this.estudos.registrarSessao({
      materiaId: Number(this.sessaoMateriaId),
      minutos: this.sessaoMinutos,
      anotacoes: this.sessaoAnotacoes.trim() || undefined,
    }).subscribe({
      next: () => {
        this.sessaoAnotacoes = '';
        this.sessaoMinutos = 30;
        this.carregarSessoes();
      },
      error: err => this.erro.set(err?.error?.message ?? 'Não foi possível registrar a sessão.'),
    });
  }
}
