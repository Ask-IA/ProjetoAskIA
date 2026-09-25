// src/app/pages/cronograma/cronograma.ts
//
// Metas semanais + registro de sessões de estudo.
// Listas e campos em signals (app zoneless): sem isso, o que vem do backend
// não aparecia até um clique qualquer, e os campos não limpavam depois de salvar.
//
// Remover meta tem "Desfazer" por 5 s, como os tópicos em Matérias.

import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import {
  DiaSemana, EstudosService, Materia, Meta, SessaoEstudo,
} from '../../services/estudos.service';
import { areaDaMateria, classeArea } from '../../core/areas';
import { Icone } from '../../shared/icone';

@Component({
  selector: 'app-cronograma',
  standalone: true,
  imports: [FormsModule, DatePipe, Icone],
  templateUrl: './cronograma.html',
  styleUrl: './cronograma.css',
  host: { class: 'pagina' },
})
export class Cronograma implements OnInit, OnDestroy {
  private estudos = inject(EstudosService);

  readonly dias: DiaSemana[] = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

  materias = signal<Materia[]>([]);
  metas = signal<Meta[]>([]);
  sessoes = signal<SessaoEstudo[]>([]);
  erro = signal('');

  // formulário de meta
  metaMateriaId = signal<number | null>(null);
  metaDia = signal<DiaSemana>('Segunda');
  metaHora = signal('');
  metaDescricao = signal('');

  // formulário de sessão
  sessaoMateriaId = signal<number | null>(null);
  sessaoMinutos = signal(30);
  sessaoAnotacoes = signal('');

  metaRemovendo = signal<Meta | null>(null);
  private temporizadorRemocao?: ReturnType<typeof setTimeout>;

  /** Metas de cada dia, já sem a que está esperando o "Desfazer". */
  readonly metasPorDia = computed(() => {
    const removendo = this.metaRemovendo()?.id;
    const porDia = new Map<DiaSemana, Meta[]>();
    for (const dia of this.dias) {
      porDia.set(dia, this.metas()
        .filter(m => m.dia === dia && m.id !== removendo)
        .sort((a, b) => a.hora.localeCompare(b.hora)));
    }
    return porDia;
  });

  ngOnInit(): void {
    this.estudos.listarMaterias().subscribe({
      next: m => this.materias.set(m),
      error: () => this.erro.set('Não foi possível carregar suas matérias.'),
    });
    this.carregarMetas();
    this.carregarSessoes();
  }

  ngOnDestroy(): void {
    this.confirmarRemocao();
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

  nomeMateria(id: number): string {
    return this.materias().find(m => m.id === id)?.nome ?? '—';
  }

  classeDaMateria(id: number): string {
    return classeArea(areaDaMateria(this.nomeMateria(id)));
  }

  adicionarMeta(): void {
    const materiaId = this.metaMateriaId();
    if (materiaId === null || !this.metaHora()) return;
    this.erro.set('');

    this.estudos.adicionarMeta({
      materiaId: Number(materiaId),
      dia: this.metaDia(),
      hora: this.metaHora(),
      descricao: this.metaDescricao().trim() || undefined,
    }).subscribe({
      next: () => {
        this.metaHora.set('');
        this.metaDescricao.set('');
        this.carregarMetas();
      },
      error: err => this.erro.set(err?.error?.message ?? 'Não foi possível criar a meta.'),
    });
  }

  removerMeta(meta: Meta): void {
    this.confirmarRemocao();
    this.metaRemovendo.set(meta);
    this.temporizadorRemocao = setTimeout(() => this.confirmarRemocao(), 5000);
  }

  desfazerRemocao(): void {
    clearTimeout(this.temporizadorRemocao);
    this.metaRemovendo.set(null);
  }

  private confirmarRemocao(): void {
    const meta = this.metaRemovendo();
    if (!meta) return;
    clearTimeout(this.temporizadorRemocao);
    this.metaRemovendo.set(null);
    this.estudos.removerMeta(meta.id).subscribe({
      next: () => this.carregarMetas(),
      error: () => this.erro.set('Não foi possível remover a meta.'),
    });
  }

  registrarSessao(): void {
    const materiaId = this.sessaoMateriaId();
    if (materiaId === null || this.sessaoMinutos() <= 0) return;
    this.erro.set('');

    this.estudos.registrarSessao({
      materiaId: Number(materiaId),
      minutos: this.sessaoMinutos(),
      anotacoes: this.sessaoAnotacoes().trim() || undefined,
    }).subscribe({
      next: () => {
        this.sessaoAnotacoes.set('');
        this.sessaoMinutos.set(30);
        this.carregarSessoes();
      },
      error: err => this.erro.set(err?.error?.message ?? 'Não foi possível registrar a sessão.'),
    });
  }
}
