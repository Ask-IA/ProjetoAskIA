// src/app/layout/conta-acoes/conta-acoes.ts
//
// Conta do aluno: modo escuro + nome + Sair.
//
// Aparece em dois lugares:
// - modo "menu": rodapé do menu lateral, no computador;
// - modo "compacto": botão com as iniciais no topo do Painel, no celular.
//   No celular a barra de baixo tem só os 5 destinos, então Sair e Modo
//   escuro precisavam de outro lugar — antes o Sair ficava fora da tela.

import { Component, ElementRef, computed, inject, input, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { TemaService } from '../../core/tema.service';
import { Icone } from '../../shared/icone';

let proximoId = 0;

@Component({
  selector: 'app-conta-acoes',
  imports: [Icone, NgTemplateOutlet],
  templateUrl: './conta-acoes.html',
  styleUrl: './conta-acoes.css',
  host: {
    '(document:click)': 'fecharSeClicouFora($event)',
    '(keydown.escape)': 'fecharMenu(true)',
  },
})
export class ContaAcoes {
  private auth = inject(AuthService);
  private router = inject(Router);
  private elemento: ElementRef<HTMLElement> = inject(ElementRef);
  protected tema = inject(TemaService);

  readonly modo = input<'menu' | 'compacto'>('menu');

  protected readonly idMenu = `menu-conta-${++proximoId}`;
  protected readonly aberto = signal(false);
  protected readonly saindo = signal(false);

  protected readonly nome = computed(() => this.auth.usuario()?.name ?? 'Estudante');
  protected readonly email = computed(() => this.auth.usuario()?.email ?? '');
  protected readonly iniciais = computed(() =>
    this.nome()
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(parte => parte[0].toUpperCase())
      .join('')
  );

  alternarMenu(): void {
    this.aberto.update(valor => !valor);
  }

  fecharMenu(devolverFoco = false): void {
    if (!this.aberto()) return;
    this.aberto.set(false);
    if (devolverFoco) {
      this.elemento.nativeElement.querySelector<HTMLButtonElement>('.avatar-botao')?.focus();
    }
  }

  fecharSeClicouFora(evento: Event): void {
    if (!this.elemento.nativeElement.contains(evento.target as Node)) {
      this.fecharMenu();
    }
  }

  sair(): void {
    if (this.saindo()) return;
    this.saindo.set(true);
    this.auth.logout().subscribe({
      // Mesmo se o backend falhar, o aluno volta para o login:
      // a pior experiência seria tocar em "Sair" e nada acontecer.
      next: () => this.irParaLogin(),
      error: () => this.irParaLogin(),
    });
  }

  private irParaLogin(): void {
    this.saindo.set(false);
    this.router.navigateByUrl('/login');
  }
}
