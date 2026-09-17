// src/app/pages/progresso/progresso.ts
//
// Visão de progresso do aluno com DADOS FALSOS:
// ofensiva (dias seguidos estudando), domínio por matéria e minutos por matéria.

import { Component, OnInit, inject } from '@angular/core';
import { DesempenhoMateria, EstudosService } from '../../services/estudos.service';

@Component({
  selector: 'app-progresso',
  standalone: true,
  templateUrl: './progresso.html',
  styleUrl: './progresso.css',
})
export class Progresso implements OnInit {
  private estudos = inject(EstudosService);

  ofensiva = 0;
  desempenhos: DesempenhoMateria[] = [];
  carregando = true;

  ngOnInit(): void {
    this.estudos.ofensiva().subscribe(dias => (this.ofensiva = dias));
    this.estudos.desempenhoPorMateria().subscribe(lista => {
      this.desempenhos = lista;
      this.carregando = false;
    });
  }

  get totalMinutos(): number {
    return this.desempenhos.reduce((soma, d) => soma + d.minutos, 0);
  }

  larguraMinutos(minutos: number): number {
    const maximo = Math.max(...this.desempenhos.map(d => d.minutos), 1);
    return Math.round((minutos / maximo) * 100);
  }
}
