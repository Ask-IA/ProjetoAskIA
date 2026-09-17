import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-hero',
  // RouterLink PRECISA estar aqui: o template usa routerLink no botão
  // "Criar Conta Grátis". Sem este import, o Angular trata routerLink como
  // um atributo qualquer e o link não navega para lugar nenhum.
  imports: [RouterLink],
  templateUrl: './hero.html',
  styleUrl: './hero.css',
})
export class Hero {}
