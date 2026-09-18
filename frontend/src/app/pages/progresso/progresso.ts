// src/app/pages/progresso/progresso.ts
//
// Ofensiva (dias seguidos estudando), domínio e minutos por matéria.
// Usa signals pelo mesmo motivo do Painel: o app é zoneless, e só o signal
// avisa o Angular para redesenhar a tela quando o dado chega.

import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DesempenhoMateria, EstudosService } from '../../services/estudos.service';

@Component({
  selector: 'app-progresso',
  standalone: true,
  templateUrl: './progresso.html',
  styleUrl: './progresso.css',
})
export class Progresso implements OnInit {
  private estudos = inject(EstudosService);

  ofensiva = signal(0);
  desempenhos = signal<DesempenhoMateria[]>([]);
  carregando = signal(true);
  erro = signal('');

  /** Recalculado sozinho sempre que `desempenhos` muda. */
  totalMinutos = computed(() =>
    this.desempenhos().reduce((soma, d) => soma + d.minutos, 0)
  );

  ngOnInit(): void {
    this.carregar();
  }

  carregar(): void {
    this.carregando.set(true);
    this.erro.set('');

    this.estudos.progresso().subscribe({
      next: p => {
        this.ofensiva.set(p.ofensiva);
        this.desempenhos.set(p.desempenhos);
        this.carregando.set(false);
      },
      error: () => {
        this.carregando.set(false);
        this.erro.set('Não foi possível carregar seu progresso.');
      },
    });
  }

  larguraMinutos(minutos: number): number {
    const maximo = Math.max(...this.desempenhos().map(d => d.minutos), 1);
    return Math.round((minutos / maximo) * 100);
  }
}
