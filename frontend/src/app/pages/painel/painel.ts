// src/app/pages/painel/painel.ts
//
// Dashboard do aluno (mockup "Olá, (Usuário)!") com DADOS FALSOS.
//
// TODO (integração): o nome real do usuário depende do GET /auth/me
// devolver o corpo com os dados (bug já reportado ao Jorge). Enquanto
// isso a saudação é genérica.

import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EstudosService, ResumoPainel } from '../../services/estudos.service';

@Component({
  selector: 'app-painel',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './painel.html',
  styleUrl: './painel.css',
})
export class Painel implements OnInit {
  private estudos = inject(EstudosService);

  resumo: ResumoPainel | null = null;

  ngOnInit(): void {
    this.estudos.resumoPainel().subscribe(r => (this.resumo = r));
  }

  alturaBarra(minutos: number): number {
    const maximo = Math.max(...(this.resumo?.minutosPorDia.map(d => d.minutos) ?? [1]), 1);
    return Math.round((minutos / maximo) * 100);
  }
}
