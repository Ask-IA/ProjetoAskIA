// src/app/pages/painel/painel.ts
//
// Dashboard do aluno — dados reais do backend.
//
// POR QUE SIGNALS (e não propriedades comuns):
// O projeto é Angular 22 em modo ZONELESS (não existe zone.js nas
// dependências). Sem zone.js, o Angular NÃO percebe sozinho que uma variável
// mudou dentro de um subscribe — ele só redesenha a tela quando é avisado.
// Um signal avisa por conta própria ao mudar; uma propriedade comum, não.
// Era esse o bug de "Carregando seu painel..." que nunca saía da tela: o dado
// chegava do backend, a variável era preenchida, e a tela continuava igual.

import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
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
  private auth = inject(AuthService);

  resumo = signal<ResumoPainel | null>(null);
  nome = signal('estudante');
  erro = signal('');

  ngOnInit(): void {
    // O nome vem do GET /auth/me (usa só o primeiro nome, para caber na saudação).
    this.auth.me().subscribe({
      next: usuario => {
        if (usuario?.name) this.nome.set(usuario.name.split(' ')[0]);
      },
      error: () => { /* mantém "estudante": não é motivo para travar a tela */ },
    });

    this.carregar();
  }

  carregar(): void {
    this.erro.set('');
    this.estudos.resumoPainel().subscribe({
      next: r => this.resumo.set(r),
      // Sem este error o painel ficaria "Carregando..." para sempre,
      // ESCONDENDO a falha em vez de mostrá-la.
      error: () => this.erro.set('Não foi possível carregar seu painel.'),
    });
  }

  alturaBarra(minutos: number): number {
    const maximo = Math.max(...(this.resumo()?.minutosPorDia.map(d => d.minutos) ?? [1]), 1);
    return Math.round((minutos / maximo) * 100);
  }
}
