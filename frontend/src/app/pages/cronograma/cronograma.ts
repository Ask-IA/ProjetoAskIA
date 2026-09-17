// src/app/pages/cronograma/cronograma.ts
//
// Metas semanais + registro de sessões de estudo (mockup "Cronograma"),
// com DADOS FALSOS via EstudosService.

import { Component, OnInit, inject } from '@angular/core';
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

  materias: Materia[] = [];
  metas: Meta[] = [];
  sessoes: SessaoEstudo[] = [];

  // formulário de meta
  metaMateriaId: number | null = null;
  metaDia: DiaSemana = 'Segunda';
  metaHora = '';
  metaDescricao = '';

  // formulário de sessão
  sessaoMateriaId: number | null = null;
  sessaoMinutos = 30;
  sessaoAnotacoes = '';

  ngOnInit(): void {
    this.estudos.listarMaterias().subscribe(m => (this.materias = m));
    this.carregarMetas();
    this.carregarSessoes();
  }

  private carregarMetas(): void {
    this.estudos.listarMetas().subscribe(m => (this.metas = m));
  }

  private carregarSessoes(): void {
    this.estudos.listarSessoes().subscribe(s => (this.sessoes = s));
  }

  metasDoDia(dia: DiaSemana): Meta[] {
    return this.metas
      .filter(m => m.dia === dia)
      .sort((a, b) => a.hora.localeCompare(b.hora));
  }

  nomeMateria(id: number): string {
    return this.materias.find(m => m.id === id)?.nome ?? '—';
  }

  adicionarMeta(): void {
    if (this.metaMateriaId === null || !this.metaHora) return;
    this.estudos.adicionarMeta({
      materiaId: Number(this.metaMateriaId),
      dia: this.metaDia,
      hora: this.metaHora,
      descricao: this.metaDescricao.trim() || undefined,
    }).subscribe(() => {
      this.metaHora = '';
      this.metaDescricao = '';
      this.carregarMetas();
    });
  }

  removerMeta(id: number): void {
    this.estudos.removerMeta(id).subscribe(() => this.carregarMetas());
  }

  registrarSessao(): void {
    if (this.sessaoMateriaId === null || this.sessaoMinutos <= 0) return;
    this.estudos.registrarSessao({
      materiaId: Number(this.sessaoMateriaId),
      minutos: this.sessaoMinutos,
      anotacoes: this.sessaoAnotacoes.trim() || undefined,
    }).subscribe(() => {
      this.sessaoAnotacoes = '';
      this.sessaoMinutos = 30;
      this.carregarSessoes();
    });
  }
}
